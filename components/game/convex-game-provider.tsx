"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConvexProvider, ConvexReactClient, useConvex, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  buildRoomHostLink,
  generateRoomHostToken,
  isRoomHostToken,
  ROOM_HOST_SESSION_KEY,
} from "@/lib/game/room-host";
import { sessionBelongsToEvent, sessionTokenStorageKey } from "@/lib/game/session";
import type {
  EventPhase,
  EventState,
  GameAction,
  ParticipantRoom,
  RoomHostView,
  TeamId,
  JeopardyQuestion,
  JeopardyCardInput,
} from "@/lib/game/types";
import { GameContext, type GameContextValue, type JoinRequest } from "./game-context";

const HOST_PIN_KEY = "mgsosa-west-host-pin";
const EVENT_CODE = process.env.NEXT_PUBLIC_EVENT_CODE ?? "WEST26";
const SESSION_TOKEN_KEY = sessionTokenStorageKey(EVENT_CODE);

function getSessionToken() {
  let token = window.localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token || token.length < 24) {
    token = `${crypto.randomUUID().replace(/-/g, "")}${Date.now().toString(36)}`;
    window.localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
  return token;
}

type PublicState = NonNullable<FunctionReturnType<typeof api.events.publicState>>;
type HostRoomState = NonNullable<FunctionReturnType<typeof api.rooms.hostState>>;

function toEventState(
  data: PublicState,
  answers: Map<string, string>,
  hostRoomState?: HostRoomState,
): {
  state: EventState;
  teamIdBySlug: Map<TeamId, Id<"teams">>;
  teamSlugById: Map<string, TeamId>;
} {
  const slugByTeamId = new Map<string, TeamId>();
  const teamIdBySlug = new Map<TeamId, Id<"teams">>();
  for (const team of data.teams) {
    slugByTeamId.set(team._id, team.slug as TeamId);
    teamIdBySlug.set(team.slug as TeamId, team._id);
  }
  const slugOf = (teamId: string | undefined) => teamId ? (slugByTeamId.get(teamId) ?? null) : null;
  const protectedRoomById = new Map(hostRoomState?.rooms.map((room) => [room._id, room]) ?? []);

  const state: EventState = {
    eventCode: data.event.code,
    eventTitle: data.event.title,
    phase: data.event.phase as EventPhase,
    phaseStartedAt: data.event.phaseStartedAt,
    activeRoomMessage: data.event.activeRoomMessage,
    teams: data.teams.map((team) => ({
      id: team.slug as TeamId,
      name: team.name,
      shortName: team.shortName,
      color: team.color,
      accent: team.accent,
    })),
    players: hostRoomState?.players
      ? hostRoomState.players.map((player) => ({
          id: player.playerId,
          name: player.name,
          church: player.church,
          teamId: slugOf(player.teamId),
          role: "participant" as const,
          connected: Date.now() - player.lastSeenAt < 15 * 60 * 1000,
        }))
      : data.winner
        ? [
          {
            id: data.winner._id,
            name: data.winner.name,
            church: "",
            teamId: slugOf(data.winner.teamId) ?? data.teams[0]?.slug ?? "pacific",
            role: "participant",
            connected: true,
          },
          ]
        : [],
    breakoutRooms: data.rooms.map((room) => {
      const protectedRoom = protectedRoomById.get(room._id);
      return {
        id: room._id,
        name: room.name,
        game: room.game,
        code: protectedRoom?.code ?? room.code,
        hostName: room.hostName,
        status: room.status,
        rotationGroups: room.rotationGroups,
        capacity: protectedRoom?.capacity ?? room.capacity ?? 12,
        memberCount: protectedRoom?.memberCount,
        externalUrl: protectedRoom?.externalUrl ?? room.externalUrl,
        hasActiveHostGrant: protectedRoom?.hostGrantActive ?? false,
      };
    }),
    questions: data.questions.map((question) => ({
      id: question._id,
      category: question.category,
      value: question.value as JeopardyQuestion["value"],
      clue: question.clue,
      answer: answers.get(question._id) ?? "",
      ageBand: question.ageBand as JeopardyQuestion["ageBand"],
      sourceId: question.sourceId,
      used: question.used,
      round: (question.round ?? 1) as 1 | 2,
    })),
    currentQuestionId: data.game?.currentQuestionId ?? undefined,
    jeopardyRound: (data.game?.activeRound ?? 1) as 1 | 2,
    buzzWindow: data.buzzWindow
      ? {
          id: data.buzzWindow._id,
          questionId: data.buzzWindow.questionId,
          status: data.buzzWindow.status,
          attempt: data.buzzWindow.attempt,
          openedAt: data.buzzWindow.openedAt,
          claimedAt: data.buzzWindow.claimedAt,
          winnerPlayerId: data.buzzWindow.winnerPlayerId,
          lockedTeamIds: data.buzzWindow.lockedTeamIds.map(slugOf).filter((teamId): teamId is TeamId => Boolean(teamId)),
        }
      : undefined,
    scoreLedger: data.scoreEvents.map((event) => ({
      id: event._id,
      teamId: slugOf(event.teamId) ?? data.teams[0]?.slug ?? "pacific",
      delta: event.delta,
      reason: event.reason,
      idempotencyKey: event.idempotencyKey,
      questionId: event.questionId,
      createdAt: event.createdAt,
    })),
    settings: {
      subtractIncorrect: data.event.subtractIncorrect,
      answerSeconds: data.event.answerSeconds,
    },
  };
  return { state, teamIdBySlug, teamSlugById: slugByTeamId };
}

function ConnectionScreen({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="page-shell" style={{ display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center", padding: "2rem" }}>
      <div>
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>
    </main>
  );
}

function ConvexGameState({ children }: { children: React.ReactNode }) {
  const convex = useConvex();
  const pathname = usePathname();
  const isHostRoute = pathname === "/host" || pathname.startsWith("/host/");
  const [sessionToken, setSessionToken] = useState<string>();
  const [hostPin, setHostPin] = useState<string | null>(null);
  const [roomHostToken, setRoomHostToken] = useState<string | null>(null);
  const [credentialsReady, setCredentialsReady] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = getSessionToken();
    queueMicrotask(() => {
      if (!cancelled) setSessionToken(token);
    });
    const storedHostPin = window.sessionStorage.getItem(HOST_PIN_KEY);
    if (!storedHostPin) {
      queueMicrotask(() => {
        if (!cancelled) setCredentialsReady(true);
      });
      return () => {
        cancelled = true;
      };
    }

    void convex.query(api.events.verifyHostPin, { hostPin: storedHostPin })
      .then((valid) => {
        if (cancelled) return;
        if (valid) setHostPin(storedHostPin);
        else window.sessionStorage.removeItem(HOST_PIN_KEY);
      })
      .catch(() => {
        if (!cancelled) window.sessionStorage.removeItem(HOST_PIN_KEY);
      })
      .finally(() => {
        if (!cancelled) setCredentialsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [convex]);

  const data = useQuery(api.events.publicState, { eventCode: EVENT_CODE });
  const me = useQuery(
    api.events.me,
    sessionToken ? { sessionToken, eventCode: EVENT_CODE } : "skip",
  );
  const eventId = data?.event._id;
  const hostView = useQuery(
    api.jeopardy.hostState,
    hostPin && eventId && isHostRoute ? { eventId, hostPin } : "skip",
  );
  const hostRoomState = useQuery(
    api.rooms.hostState,
    hostPin && eventId && isHostRoute ? { eventId, hostPin } : "skip",
  );
  const roomHostData = useQuery(
    api.rooms.roomHostState,
    roomHostToken ? { token: roomHostToken } : "skip",
  );
  const jeopardySetsData = useQuery(
    api.jeopardy.listSets,
    hostPin && eventId && isHostRoute ? { eventId, hostPin } : "skip",
  );

  const joinEvent = useMutation(api.events.join);
  const joinBreakoutRoom = useMutation(api.rooms.joinRoom);
  const setPhase = useMutation(api.events.setPhase);
  const selectQuestion = useMutation(api.jeopardy.selectQuestion);
  const openBuzzers = useMutation(api.jeopardy.openBuzzers);
  const buzz = useMutation(api.jeopardy.buzz);
  const judge = useMutation(api.jeopardy.judge);
  const returnToBoard = useMutation(api.jeopardy.returnToBoard);
  const adjustScore = useMutation(api.scores.adjust);
  const undoScore = useMutation(api.scores.undoLast);
  const setCodeAsHost = useMutation(api.rooms.setCodeAsHost);
  const setCodeAsRoomHost = useMutation(api.rooms.setCodeAsRoomHost);
  const issueHostGrant = useMutation(api.rooms.issueHostGrant);
  const revokeHostGrant = useMutation(api.rooms.revokeHostGrant);
  const awardRoomResultAsHost = useMutation(api.rooms.awardRoomResult);
  const clearParticipantsMutation = useMutation(api.events.clearParticipants);
  const createRoomMutation = useMutation(api.rooms.createRoom);
  const setRoomCapacityMutation = useMutation(api.rooms.setRoomCapacity);
  const setJeopardyRound = useMutation(api.jeopardy.setRound);
  const assignBalancedTeamsMutation = useMutation(api.teams.assignBalanced);
  const createJeopardySetMutation = useMutation(api.jeopardy.createSet);
  const activateJeopardySetMutation = useMutation(api.jeopardy.activateSet);
  const resolveManualMutation = useMutation(api.jeopardy.resolveManual);

  const answers = useMemo(() => {
    const map = new Map<string, string>();
    for (const question of hostView?.questions ?? []) map.set(question._id, question.answer);
    return map;
  }, [hostView]);

  const mapped = useMemo(
    () => (data ? toEventState(data, answers, hostRoomState ?? undefined) : null),
    [data, answers, hostRoomState],
  );

  const dispatch = useCallback(
    (action: GameAction) => {
      if (!eventId || !mapped) return;
      const pin = hostPin ?? "";
      const run = (promise: Promise<unknown>) =>
        promise.catch((error: unknown) => {
          console.error("Convex action failed", action.type, error);
          setActionError(`Could not complete ${action.type.replaceAll("-", " ")}. Check your connection or staff access and try again.`);
        });
      setActionError(null);
      switch (action.type) {
        case "select-question":
          return run(selectQuestion({ eventId, questionId: action.questionId as Id<"questions">, hostPin: pin }));
        case "open-buzzers":
          return run(openBuzzers({ eventId, hostPin: pin }));
        case "buzz":
          if (sessionToken) return run(buzz({ eventId, sessionToken }));
          return;
        case "mark-correct":
          return run(judge({ eventId, correct: true, hostPin: pin }));
        case "mark-incorrect":
          return run(judge({ eventId, correct: false, hostPin: pin }));
        case "return-to-board":
          return run(returnToBoard({ eventId, hostPin: pin }));
        case "set-jeopardy-round":
          return run(setJeopardyRound({ eventId, round: action.round, hostPin: pin }));
        case "adjust-score": {
          const teamId = mapped.teamIdBySlug.get(action.teamId);
          if (teamId) {
            return run(adjustScore({
              eventId,
              teamId,
              delta: action.delta,
              reason: action.reason,
              hostPin: pin,
              idempotencyKey: action.idempotencyKey,
            }));
          }
          return;
        }
        case "undo-score":
          return run(undoScore({ eventId, hostPin: pin }));
        case "set-phase":
          return run(setPhase({ eventId, hostPin: pin, phase: action.phase, message: action.message }));
        default:
          return;
      }
    },
    [eventId, mapped, hostPin, sessionToken, selectQuestion, openBuzzers, buzz, judge, returnToBoard, setJeopardyRound, adjustScore, undoScore, setPhase],
  );

  const join = useCallback(
    async (input: JoinRequest) => {
      const token = getSessionToken();
      setSessionToken(token);
      await joinEvent({ eventCode: input.eventCode, sessionToken: token, name: input.name, church: input.church });
    },
    [joinEvent],
  );

  const joinRoom = useCallback(
    async (code: string) => {
      if (!sessionToken) throw new Error("Join the main event first.");
      setActionError(null);
      const result = await joinBreakoutRoom({ code: code.trim(), sessionToken });
      if (!result.ok) throw new Error(result.error);
    },
    [joinBreakoutRoom, sessionToken],
  );

  const submitHostPin = useCallback(
    async (pin: string) => {
      const valid = await convex.query(api.events.verifyHostPin, { hostPin: pin });
      if (valid) {
        window.sessionStorage.setItem(HOST_PIN_KEY, pin);
        setHostPin(pin);
      }
      return valid;
    },
    [convex],
  );

  const clearHostPin = useCallback(() => {
    window.sessionStorage.removeItem(HOST_PIN_KEY);
    setHostPin(null);
  }, []);

  const activateRoomHost = useCallback((token: string) => {
    setRoomHostToken(isRoomHostToken(token) ? token : null);
  }, []);

  const clearRoomHost = useCallback(() => {
    window.sessionStorage.removeItem(ROOM_HOST_SESSION_KEY);
    setRoomHostToken(null);
  }, []);

  const issueRoomHostLink = useCallback(
    async (roomId: string) => {
      if (!hostPin) throw new Error("Game Master access is required.");
      const token = generateRoomHostToken();
      await issueHostGrant({ roomId: roomId as Id<"breakoutRooms">, token, hostPin });
      return buildRoomHostLink(window.location.origin, token);
    },
    [hostPin, issueHostGrant],
  );

  const revokeRoomHostLink = useCallback(
    async (roomId: string) => {
      if (!hostPin) throw new Error("Game Master access is required.");
      await revokeHostGrant({ roomId: roomId as Id<"breakoutRooms">, hostPin });
    },
    [hostPin, revokeHostGrant],
  );

  const setRoomCode = useCallback(
    async (roomId: string, code: string) => {
      setActionError(null);
      const mutation = hostPin
        ? setCodeAsHost({ roomId: roomId as Id<"breakoutRooms">, code, hostPin })
        : roomHostToken
          ? setCodeAsRoomHost({ token: roomHostToken, code })
          : Promise.reject(new Error("Room host access is required."));
      await mutation.catch((error: unknown) => {
        console.error("Room code update failed", error);
        setActionError("Could not update the room code. Check your connection or room-host link and try again.");
        throw error;
      });
    },
    [hostPin, roomHostToken, setCodeAsHost, setCodeAsRoomHost],
  );

  const awardRoomResult = useCallback(
    async (roomId: string, teamId: TeamId, reason: string, idempotencyKey: string) => {
      if (!eventId || !mapped) throw new Error("Event is not ready.");
      const teamDocumentId = mapped.teamIdBySlug.get(teamId);
      if (!teamDocumentId) throw new Error("Team is not available.");
      setActionError(null);
      const mutation = hostPin
        ? adjustScore({
              eventId,
              teamId: teamDocumentId,
              delta: 200,
              reason,
              hostPin,
              idempotencyKey,
            })
        : roomHostToken
          ? awardRoomResultAsHost({ token: roomHostToken, teamId: teamDocumentId })
          : Promise.reject(new Error("Room host access is required."));
      await mutation.catch((error: unknown) => {
        console.error("Room result failed", roomId, error);
        setActionError("Could not submit the room result. Check your connection and try again.");
        throw error;
      });
    },
    [adjustScore, awardRoomResultAsHost, eventId, hostPin, mapped, roomHostToken],
  );

  const clearParticipants = useCallback(async (confirmation: string, expectedCount: number) => {
    if (!eventId || !hostPin) throw new Error("Game Master access is required.");
    const result = await clearParticipantsMutation({ eventId, hostPin, confirmation, expectedCount });
    return result.cleared;
  }, [clearParticipantsMutation, eventId, hostPin]);

  const createRoom = useCallback(async (input: { name: string; game: "imposter" | "gartic"; capacity: number; rotationGroups: string[] }) => {
    if (!eventId || !hostPin) throw new Error("Game Master access is required.");
    await createRoomMutation({ eventId, hostPin, ...input });
  }, [createRoomMutation, eventId, hostPin]);

  const setRoomCapacity = useCallback(async (roomId: string, capacity: number) => {
    if (!hostPin) throw new Error("Game Master access is required.");
    await setRoomCapacityMutation({ roomId: roomId as Id<"breakoutRooms">, capacity, hostPin });
  }, [hostPin, setRoomCapacityMutation]);

  const assignBalancedTeams = useCallback(async (minimumGroups: number, targetSize: number) => {
    if (!eventId || !hostPin) throw new Error("Game Master access is required.");
    return await assignBalancedTeamsMutation({ eventId, hostPin, minimumGroups, targetSize });
  }, [assignBalancedTeamsMutation, eventId, hostPin]);

  const createJeopardySet = useCallback(async (title: string, cards: JeopardyCardInput[]) => {
    if (!eventId || !hostPin) throw new Error("Game Master access is required.");
    await createJeopardySetMutation({ eventId, hostPin, title, cards });
  }, [createJeopardySetMutation, eventId, hostPin]);

  const activateJeopardySet = useCallback(async (setId: string | null) => {
    if (!eventId || !hostPin) throw new Error("Game Master access is required.");
    await activateJeopardySetMutation({ eventId, hostPin, setId: setId as Id<"jeopardySets"> | null });
  }, [activateJeopardySetMutation, eventId, hostPin]);

  const resolveJeopardyManually = useCallback(async (teamId: TeamId | null, multiplier: -1 | 0 | 1) => {
    if (!eventId || !hostPin || !mapped) throw new Error("Game Master access is required.");
    const teamDocumentId = teamId ? mapped.teamIdBySlug.get(teamId) ?? null : null;
    await resolveManualMutation({ eventId, hostPin, teamId: teamDocumentId, multiplier });
  }, [eventId, hostPin, mapped, resolveManualMutation]);

  // undefined = lookup in flight, null = this device has not joined the event.
  const identity = useMemo(
    () =>
      me === undefined || data === undefined
        ? undefined
        : me === null || !sessionBelongsToEvent(me.eventId, eventId)
          ? null
          : {
              playerId: me.playerId,
              name: me.name,
              church: me.church,
              teamId: (me.teamSlug as TeamId | null) ?? null,
              rotationGroup: me.rotationGroup,
            },
    [data, eventId, me],
  );

  const currentRoom = useMemo<ParticipantRoom | null | undefined>(() => {
    if (me === undefined) return undefined;
    if (!me?.currentRoom) return null;
    return {
      id: me.currentRoom.roomId,
      name: me.currentRoom.name,
      game: me.currentRoom.game,
      status: me.currentRoom.status,
      rotationGroups: me.currentRoom.rotationGroups,
      externalUrl: me.currentRoom.externalUrl,
      capacity: me.currentRoom.capacity ?? 12,
    };
  }, [me]);

  const roomHostView = useMemo<RoomHostView | null | undefined>(() => {
    if (!roomHostToken) return null;
    if (roomHostData === undefined || !mapped) return undefined;
    if (roomHostData === null) return null;
    return {
      room: {
        id: roomHostData.room._id,
        name: roomHostData.room.name,
        game: roomHostData.room.game,
        code: roomHostData.room.code,
        hostName: roomHostData.room.hostName,
        status: roomHostData.room.status,
        rotationGroups: roomHostData.room.rotationGroups,
        capacity: roomHostData.room.capacity ?? 12,
        externalUrl: roomHostData.room.externalUrl,
      },
      members: roomHostData.players.map((player) => ({
        id: player.playerId,
        name: player.name,
        church: player.church,
        teamId: player.teamId ? mapped.teamSlugById.get(player.teamId) ?? null : null,
      })),
      expiresAt: roomHostData.grantExpiresAt,
    };
  }, [mapped, roomHostData, roomHostToken]);

  const value = useMemo<GameContextValue | null>(
    () =>
      mapped && credentialsReady
        ? {
            mode: "convex",
            state: mapped.state,
            dispatch,
            reset: clearHostPin,
            identity,
            currentRoom,
            join,
            joinRoom,
            hostPin,
            submitHostPin,
            clearHostPin,
            roomHostView,
            activateRoomHost,
            clearRoomHost,
            issueRoomHostLink,
            revokeRoomHostLink,
            setRoomCode,
            awardRoomResult,
            clearParticipants,
            createRoom,
            setRoomCapacity,
            assignBalancedTeams,
            jeopardySets: (jeopardySetsData ?? []).map((set) => ({ id: set.id, title: set.title, questionCount: set.questionCount, active: set.active })),
            createJeopardySet,
            activateJeopardySet,
            resolveJeopardyManually,
          }
        : null,
    [
      mapped,
      credentialsReady,
      dispatch,
      identity,
      currentRoom,
      join,
      joinRoom,
      hostPin,
      submitHostPin,
      clearHostPin,
      roomHostView,
      activateRoomHost,
      clearRoomHost,
      issueRoomHostLink,
      revokeRoomHostLink,
      setRoomCode,
      awardRoomResult,
      clearParticipants,
      createRoom,
      setRoomCapacity,
      assignBalancedTeams,
      jeopardySetsData,
      createJeopardySet,
      activateJeopardySet,
      resolveJeopardyManually,
    ],
  );

  if (data === undefined || !credentialsReady) {
    return <ConnectionScreen title="Connecting…" detail="Reaching the live MGSOSA West event." />;
  }
  if (data === null || !value) {
    return (
      <ConnectionScreen
        title="Event not ready"
        detail={`No event found for code ${EVENT_CODE}. Seed it with: pnpm convex run seed:event '{"hostPin":"<pin>"}'`}
      />
    );
  }
  return (
    <GameContext.Provider value={value}>
      {actionError ? (
        <div className="action-error-toast" role="alert">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} type="button" aria-label="Dismiss error">×</button>
        </div>
      ) : null}
      {children}
    </GameContext.Provider>
  );
}

export function ConvexGameProvider({ url, children }: { url: string; children: React.ReactNode }) {
  const [client] = useState(() => new ConvexReactClient(url));
  return (
    <ConvexProvider client={client}>
      <ConvexGameState>{children}</ConvexGameState>
    </ConvexProvider>
  );
}
