import type {
  BuzzClaimResult,
  EventState,
  GameAction,
  ScoreEvent,
  TeamId,
} from "./types";

function id(prefix: string, at: number) {
  return `${prefix}-${at}`;
}

export function getTeamScore(state: EventState, teamId: TeamId) {
  return state.scoreLedger
    .filter((event) => event.teamId === teamId)
    .reduce((total, event) => total + event.delta, 0);
}

export function getCurrentQuestion(state: EventState) {
  return state.questions.find((question) => question.id === state.currentQuestionId);
}

export function claimBuzz(state: EventState, playerId: string, at: number): BuzzClaimResult {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) return { accepted: false, reason: "unknown-player", state };
  if (!player.teamId) return { accepted: false, reason: "unknown-player", state };
  if (!state.buzzWindow || state.buzzWindow.status === "locked") {
    return { accepted: false, reason: "closed", state };
  }
  if (state.buzzWindow.status === "claimed") {
    return { accepted: false, reason: "already-claimed", state };
  }
  if (state.buzzWindow.lockedTeamIds.includes(player.teamId)) {
    return { accepted: false, reason: "team-locked", state };
  }

  return {
    accepted: true,
    reason: "accepted",
    state: {
      ...state,
      buzzWindow: {
        ...state.buzzWindow,
        status: "claimed",
        winnerPlayerId: player.id,
        claimedAt: at,
      },
    },
  };
}

function appendScore(state: EventState, event: ScoreEvent): EventState {
  return { ...state, scoreLedger: [...state.scoreLedger, event] };
}

export function gameReducer(state: EventState, action: GameAction): EventState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "select-question": {
      const question = state.questions.find((candidate) => candidate.id === action.questionId);
      if (!question || question.used) return state;
      return {
        ...state,
        currentQuestionId: question.id,
        buzzWindow: {
          id: id("window", action.at),
          questionId: question.id,
          status: "locked",
          attempt: 1,
          lockedTeamIds: [],
        },
      };
    }
    case "open-buzzers": {
      if (
        !state.buzzWindow ||
        !state.currentQuestionId ||
        state.buzzWindow.status !== "locked"
      ) {
        return state;
      }
      return {
        ...state,
        buzzWindow: {
          ...state.buzzWindow,
          id: id("window", action.at),
          status: "open",
          attempt: state.buzzWindow.attempt + (state.buzzWindow.openedAt ? 1 : 0),
          openedAt: action.at,
          claimedAt: undefined,
          winnerPlayerId: undefined,
        },
      };
    }
    case "buzz":
      return claimBuzz(state, action.playerId, action.at).state;
    case "mark-correct": {
      const question = getCurrentQuestion(state);
      const winner = state.players.find((player) => player.id === state.buzzWindow?.winnerPlayerId);
      if (!question || !winner?.teamId || state.buzzWindow?.status !== "claimed") return state;
      const scored = appendScore(state, {
        id: id("score", action.at),
        teamId: winner.teamId,
        delta: question.value,
        reason: `${winner.name} answered ${question.category} for ${question.value}`,
        questionId: question.id,
        createdAt: action.at,
      });
      return {
        ...scored,
        questions: scored.questions.map((candidate) =>
          candidate.id === question.id ? { ...candidate, used: true } : candidate,
        ),
        buzzWindow: scored.buzzWindow ? { ...scored.buzzWindow, status: "locked" } : undefined,
      };
    }
    case "mark-incorrect": {
      const question = getCurrentQuestion(state);
      const winner = state.players.find((player) => player.id === state.buzzWindow?.winnerPlayerId);
      if (!question || !winner?.teamId || state.buzzWindow?.status !== "claimed") return state;
      const next = state.settings.subtractIncorrect
        ? appendScore(state, {
            id: id("score", action.at),
            teamId: winner.teamId,
            delta: -question.value,
            reason: `${winner.name} missed ${question.category} for ${question.value}`,
            questionId: question.id,
            createdAt: action.at,
          })
        : state;
      return {
        ...next,
        buzzWindow: next.buzzWindow
          ? {
              ...next.buzzWindow,
              status: "locked",
              lockedTeamIds: Array.from(new Set([...next.buzzWindow.lockedTeamIds, winner.teamId])),
            }
          : undefined,
      };
    }
    case "return-to-board":
      return { ...state, currentQuestionId: undefined, buzzWindow: undefined };
    case "set-jeopardy-round":
      return { ...state, jeopardyRound: action.round, currentQuestionId: undefined, buzzWindow: undefined };
    case "adjust-score":
      if (
        action.idempotencyKey &&
        state.scoreLedger.some((event) => event.idempotencyKey === action.idempotencyKey)
      ) {
        return state;
      }
      return appendScore(state, {
        id: id("adjustment", action.at),
        teamId: action.teamId,
        delta: action.delta,
        reason: action.reason,
        idempotencyKey: action.idempotencyKey,
        createdAt: action.at,
      });
    case "undo-score":
      return state.scoreLedger.length
        ? { ...state, scoreLedger: state.scoreLedger.slice(0, -1) }
        : state;
    case "set-room-code":
      return {
        ...state,
        breakoutRooms: state.breakoutRooms.map((room) =>
          room.id === action.roomId ? { ...room, code: action.code } : room,
        ),
      };
    case "set-phase":
      return {
        ...state,
        phase: action.phase,
        phaseStartedAt: action.at,
        activeRoomMessage: action.message,
      };
    default:
      return state;
  }
}
