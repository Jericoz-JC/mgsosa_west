export type Role = "participant" | "room-admin" | "game-master" | "display";

export type EventPhase =
  | "lobby"
  | "rotation-one"
  | "switching"
  | "rotation-two"
  | "intermission"
  | "jeopardy"
  | "closing";

export type TeamId = string;

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
  teamId: TeamId | null;
  role: Role;
  connected: boolean;
}

export interface JeopardyQuestion {
  id: string;
  category: string;
  value: number;
  clue: string;
  answer: string;
  ageBand: "Ages 9-12" | "Ages 13-17" | "Ages 18-25";
  sourceId: string;
  used: boolean;
  round: 1 | 2;
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
  hasActiveHostGrant?: boolean;
  capacity: number;
  memberCount?: number;
}

export type ParticipantRoom = Pick<
  BreakoutRoom,
  "id" | "name" | "game" | "status" | "rotationGroups" | "externalUrl" | "capacity"
>;

export interface RoomHostMember {
  id: string;
  name: string;
  church: string;
  teamId: TeamId | null;
}

export interface RoomHostView {
  room: BreakoutRoom;
  members: RoomHostMember[];
  expiresAt: number;
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
  jeopardyRound: 1 | 2;
  currentQuestionId?: string;
  buzzWindow?: BuzzWindow;
  scoreLedger: ScoreEvent[];
  settings: {
    subtractIncorrect: boolean;
    answerSeconds: number;
  };
}

export interface TeamAssignmentPlan {
  participantCount: number;
  requestedGroupCount: number;
  targetSize: number;
  groupCount: number;
  sizes: number[];
}

export interface JeopardySetSummary {
  id: string | null;
  title: string;
  questionCount: number;
  active: boolean;
}

export interface JeopardyCardInput {
  category: string;
  value: number;
  clue: string;
  answer: string;
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
  | { type: "set-room-code"; roomId: string; code: string }
  | { type: "set-jeopardy-round"; round: 1 | 2 }
  | { type: "set-phase"; phase: EventPhase; message: string; at: number };

export interface BuzzClaimResult {
  accepted: boolean;
  reason: "accepted" | "closed" | "already-claimed" | "team-locked" | "unknown-player";
  state: EventState;
}
