"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConvexProvider, ConvexReactClient, useConvex, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { sessionBelongsToEvent, sessionTokenStorageKey } from "@/lib/game/session";
import type { EventPhase, EventState, GameAction, JeopardyQuestion, TeamId } from "@/lib/game/types";
import { GameContext, type GameContextValue, type JoinRequest } from "./game-context";

const HOST_PIN_KEY = "mgsosa-west-host-pin";
const ROOM_PIN_KEY = "mgsosa-west-room-pin";
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

function toEventState(
  data: PublicState,
  answers: Map<string, string>,
): { state: EventState; teamIdBySlug: Map<TeamId, Id<"teams">> } {
  const slugByTeamId = new Map<string, TeamId>();
  const teamIdBySlug = new Map<TeamId, Id<"teams">>();
  for (const team of data.teams) {
    slugByTeamId.set(team._id, team.slug as TeamId);
    teamIdBySlug.set(team.slug as TeamId, team._id);
  }
  const slugOf = (teamId: string) => slugByTeamId.get(teamId) ?? "pacific";

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
    players: data.winner
      ? [
          {
            id: data.winner._id,
            name: data.winner.name,
            church: "",
            teamId: slugOf(data.winner.teamId),
            role: "participant",
            connected: true,
          },
        ]
      : [],
    breakoutRooms: data.rooms.map((room) => ({
      id: room._id,
      name: room.name,
      game: room.game,
      code: room.code,
      hostName: room.hostName,
      status: room.status,
      rotationGroups: room.rotationGroups,
      externalUrl: room.externalUrl,
    })),
    questions: data.questions.map((question) => ({
      id: question._id,
      category: question.category,
      value: question.value as JeopardyQuestion["value"],
      clue: question.clue,
      answer: answers.get(question._id) ?? "",
      ageBand: question.ageBand as JeopardyQuestion["ageBand"],
      sourceId: question.sourceId,
      used: question.used,
    })),
    currentQuestionId: data.game?.currentQuestionId ?? undefined,
    buzzWindow: data.buzzWindow
      ? {
          id: data.buzzWindow._id,
          questionId: data.buzzWindow.questionId,
          status: data.buzzWindow.status,
          attempt: data.buzzWindow.attempt,
          openedAt: data.buzzWindow.openedAt,
          claimedAt: data.buzzWindow.claimedAt,
          winnerPlayerId: data.buzzWindow.winnerPlayerId,
          lockedTeamIds: data.buzzWindow.lockedTeamIds.map(slugOf),
        }
      : undefined,
    scoreLedger: data.scoreEvents.map((event) => ({
      id: event._id,
      teamId: slugOf(event.teamId),
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
  return { state, teamIdBySlug };
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
  const [sessionToken, setSessionToken] = useState<string>();
  const [hostPin, setHostPin] = useState<string | null>(null);
  const [roomPin, setRoomPin] = useState<string | null>(null);
  const [credentialsReady, setCredentialsReady] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const token = getSessionToken();
    queueMicrotask(() => {
      if (!cancelled) setSessionToken(token);
    });
    const storedHostPin = window.sessionStorage.getItem(HOST_PIN_KEY);
    const storedRoomPin = window.sessionStorage.getItem(ROOM_PIN_KEY);
    if (!storedHostPin && !storedRoomPin) {
      queueMicrotask(() => {
        if (!cancelled) setCredentialsReady(true);
      });
      return () => {
        cancelled = true;
      };
    }

    const checks: Promise<void>[] = [];
    if (storedHostPin) {
      checks.push(
        convex.query(api.events.verifyHostPin, { hostPin: storedHostPin }).then((valid) => {
          if (cancelled) return;
          if (valid) setHostPin(storedHostPin);
          else window.sessionStorage.removeItem(HOST_PIN_KEY);
        }).catch(() => {
          if (!cancelled) window.sessionStorage.removeItem(HOST_PIN_KEY);
        }),
      );
    }
    if (storedRoomPin) {
      checks.push(
        convex.query(api.events.verifyRoomPin, { roomPin: storedRoomPin }).then((valid) => {
          if (cancelled) return;
          if (valid) setRoomPin(storedRoomPin);
          else window.sessionStorage.removeItem(ROOM_PIN_KEY);
        }).catch(() => {
          if (!cancelled) window.sessionStorage.removeItem(ROOM_PIN_KEY);
        }),
      );
    }

    void Promise.all(checks)
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
    hostPin && eventId ? { eventId, hostPin } : "skip",
  );

  const joinEvent = useMutation(api.events.join);
  const setPhase = useMutation(api.events.setPhase);
  const selectQuestion = useMutation(api.jeopardy.selectQuestion);
  const openBuzzers = useMutation(api.jeopardy.openBuzzers);
  const buzz = useMutation(api.jeopardy.buzz);
  const judge = useMutation(api.jeopardy.judge);
  const returnToBoard = useMutation(api.jeopardy.returnToBoard);
  const adjustScore = useMutation(api.scores.adjust);
  const undoScore = useMutation(api.scores.undoLast);
  const setCode = useMutation(api.rooms.setCode);

  const answers = useMemo(() => {
    const map = new Map<string, string>();
    for (const question of hostView?.questions ?? []) map.set(question._id, question.answer);
    return map;
  }, [hostView]);

  const mapped = useMemo(() => (data ? toEventState(data, answers) : null), [data, answers]);

  const dispatch = useCallback(
    (action: GameAction) => {
      if (!eventId || !mapped) return;
      const pin = hostPin ?? "";
      const staffPin = hostPin ?? roomPin ?? "";
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
        case "adjust-score": {
          const teamId = mapped.teamIdBySlug.get(action.teamId);
          if (teamId) {
            return run(adjustScore({
              eventId,
              teamId,
              delta: action.delta,
              reason: action.reason,
              hostPin: staffPin,
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
    [eventId, mapped, hostPin, roomPin, sessionToken, selectQuestion, openBuzzers, buzz, judge, returnToBoard, adjustScore, undoScore, setPhase],
  );

  const join = useCallback(
    async (input: JoinRequest) => {
      const token = getSessionToken();
      setSessionToken(token);
      await joinEvent({ eventCode: input.eventCode, sessionToken: token, name: input.name, church: input.church });
    },
    [joinEvent],
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

  const submitRoomPin = useCallback(
    async (pin: string) => {
      const valid = await convex.query(api.events.verifyRoomPin, { roomPin: pin });
      if (valid) {
        window.sessionStorage.setItem(ROOM_PIN_KEY, pin);
        setRoomPin(pin);
      }
      return valid;
    },
    [convex],
  );

  const clearRoomPin = useCallback(() => {
    window.sessionStorage.removeItem(ROOM_PIN_KEY);
    setRoomPin(null);
  }, []);

  const setRoomCode = useCallback(
    async (roomId: string, code: string) => {
      setActionError(null);
      await setCode({ roomId: roomId as Id<"breakoutRooms">, code, hostPin: hostPin ?? roomPin ?? "" }).catch((error: unknown) => {
        console.error("Room code update failed", error);
        setActionError("Could not update the room code. Check your connection or staff access and try again.");
        throw error;
      });
    },
    [setCode, hostPin, roomPin],
  );

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

  const value = useMemo<GameContextValue | null>(
    () =>
      mapped && credentialsReady
        ? {
            mode: "convex",
            state: mapped.state,
            dispatch,
            reset: clearHostPin,
            identity,
            join,
            hostPin,
            roomPin,
            submitHostPin,
            submitRoomPin,
            clearHostPin,
            clearRoomPin,
            setRoomCode,
          }
        : null,
    [mapped, credentialsReady, dispatch, identity, join, hostPin, roomPin, submitHostPin, submitRoomPin, clearHostPin, clearRoomPin, setRoomCode],
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
