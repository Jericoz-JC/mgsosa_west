"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConvexProvider, ConvexReactClient, useConvex, useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { EventPhase, EventState, GameAction, JeopardyQuestion, TeamId } from "@/lib/game/types";
import { GameContext, type GameContextValue, type JoinRequest } from "./game-context";

const SESSION_TOKEN_KEY = "mgsosa-west-session-token";
const HOST_PIN_KEY = "mgsosa-west-host-pin";
const EVENT_CODE = process.env.NEXT_PUBLIC_EVENT_CODE ?? "WEST26";

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

  useEffect(() => {
    queueMicrotask(() => {
      setSessionToken(getSessionToken());
      setHostPin(window.sessionStorage.getItem(HOST_PIN_KEY));
    });
  }, []);

  const data = useQuery(api.events.publicState, { eventCode: EVENT_CODE });
  const me = useQuery(api.events.me, sessionToken ? { sessionToken } : "skip");
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
      const run = (promise: Promise<unknown>) =>
        promise.catch((error: unknown) => console.error("Convex action failed", action.type, error));
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
          if (teamId) return run(adjustScore({ eventId, teamId, delta: action.delta, reason: action.reason, hostPin: pin }));
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
    [eventId, mapped, hostPin, sessionToken, selectQuestion, openBuzzers, buzz, judge, returnToBoard, adjustScore, undoScore, setPhase],
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

  const setRoomCode = useCallback(
    async (roomId: string, code: string) => {
      await setCode({ roomId: roomId as Id<"breakoutRooms">, code, hostPin: hostPin ?? "" }).catch((error: unknown) =>
        console.error("Room code update failed", error),
      );
    },
    [setCode, hostPin],
  );

  const identity = useMemo(
    () =>
      me
        ? {
            playerId: me.playerId,
            name: me.name,
            church: me.church,
            teamId: (me.teamSlug as TeamId | null) ?? null,
            rotationGroup: me.rotationGroup,
          }
        : null,
    [me],
  );

  const value = useMemo<GameContextValue | null>(
    () =>
      mapped
        ? {
            mode: "convex",
            state: mapped.state,
            dispatch,
            reset: clearHostPin,
            identity,
            join,
            hostPin,
            submitHostPin,
            clearHostPin,
            setRoomCode,
          }
        : null,
    [mapped, dispatch, identity, join, hostPin, submitHostPin, clearHostPin, setRoomCode],
  );

  if (data === undefined) {
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
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function ConvexGameProvider({ url, children }: { url: string; children: React.ReactNode }) {
  const [client] = useState(() => new ConvexReactClient(url));
  return (
    <ConvexProvider client={client}>
      <ConvexGameState>{children}</ConvexGameState>
    </ConvexProvider>
  );
}
