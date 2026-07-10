export type Role = "participant" | "room-admin" | "game-master" | "display";

export type EventPhase =
  | "lobby"
  | "rotation-one"
  | "switching"
  | "rotation-two"
  | "intermission"
  | "jeopardy"
  | "closing";

export type TeamId = "pacific" | "sierra" | "desert" | "valley";

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  color: string;
  accent: string;
}

export interface Player {
  id: string;
  name: string;
  church: string;
  teamId: TeamId;
  role: Role;
  connected: boolean;
}

export interface JeopardyQuestion {
  id: string;
  category: string;
  value: 100 | 200 | 300 | 400 | 500;
  clue: string;
  answer: string;
  ageBand: "Ages 9-12" | "Ages 13-17" | "Ages 18-25";
  sourceId: string;
  used: boolean;
}

export interface BuzzWindow {
  id: string;
  questionId: string;
  status: "locked" | "open" | "claimed";
  attempt: number;
  openedAt?: number;
  claimedAt?: number;
  winnerPlayerId?: string;
  lockedTeamIds: TeamId[];
}

export interface ScoreEvent {
  id: string;
  teamId: TeamId;
  delta: number;
  reason: string;
  idempotencyKey?: string;
  questionId?: string;
  createdAt: number;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  game: "imposter" | "gartic";
  code: string;
  hostName: string;
  status: "draft" | "open" | "in-progress" | "closed";
  rotationGroups: string[];
  externalUrl?: string;
}

export interface EventState {
  eventCode: string;
  eventTitle: string;
  phase: EventPhase;
  phaseStartedAt: number;
  activeRoomMessage: string;
  teams: Team[];
  players: Player[];
  breakoutRooms: BreakoutRoom[];
  questions: JeopardyQuestion[];
  currentQuestionId?: string;
  buzzWindow?: BuzzWindow;
  scoreLedger: ScoreEvent[];
  settings: {
    subtractIncorrect: boolean;
    answerSeconds: number;
  };
}

export type GameAction =
  | { type: "hydrate"; state: EventState }
  | { type: "select-question"; questionId: string; at: number }
  | { type: "open-buzzers"; at: number }
  | { type: "buzz"; playerId: string; at: number }
  | { type: "mark-correct"; at: number }
  | { type: "mark-incorrect"; at: number }
  | { type: "return-to-board" }
  | { type: "adjust-score"; teamId: TeamId; delta: number; reason: string; at: number; idempotencyKey?: string }
  | { type: "undo-score" }
  | { type: "set-phase"; phase: EventPhase; message: string; at: number };

export interface BuzzClaimResult {
  accepted: boolean;
  reason: "accepted" | "closed" | "already-claimed" | "team-locked" | "unknown-player";
  state: EventState;
}
