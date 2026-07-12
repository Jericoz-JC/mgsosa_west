"use client";

import { createContext, useContext } from "react";
import type {
  EventState,
  GameAction,
  ParticipantRoom,
  RoomHostView,
  TeamId,
  TeamAssignmentPlan,
  JeopardyCardInput,
  JeopardySetSummary,
} from "@/lib/game/types";

export interface GameIdentity {
  playerId: string;
  name: string;
  church: string;
  teamId: TeamId | null;
  rotationGroup: string;
}

export interface JoinRequest {
  eventCode: string;
  name: string;
  church: string;
}

export interface GameContextValue {
  mode: "demo" | "convex";
  state: EventState;
  dispatch: (action: GameAction) => void;
  reset: () => void;
  /**
   * The current participant. In Convex mode: undefined while the lookup is in
   * flight, null when this device has not joined the event. Always null in demo mode.
   */
  identity: GameIdentity | null | undefined;
  /** The participant's current room for this rotation. */
  currentRoom: ParticipantRoom | null | undefined;
  join: (input: JoinRequest) => Promise<void>;
  joinRoom: (code: string) => Promise<void>;
  /** Host PIN entered on this device. Demo mode is always authorized. */
  hostPin: string | null;
  submitHostPin: (pin: string) => Promise<boolean>;
  clearHostPin: () => void;
  /** One-room volunteer access loaded from a private URL fragment. */
  roomHostView: RoomHostView | null | undefined;
  activateRoomHost: (token: string) => void;
  clearRoomHost: () => void;
  issueRoomHostLink: (roomId: string) => Promise<string>;
  revokeRoomHostLink: (roomId: string) => Promise<void>;
  setRoomCode: (roomId: string, code: string) => Promise<void>;
  awardRoomResult: (roomId: string, teamId: TeamId, reason: string, idempotencyKey: string) => Promise<void>;
  clearParticipants: (confirmation: string, expectedCount: number) => Promise<number>;
  createRoom: (input: { name: string; game: "imposter" | "gartic"; capacity: number; rotationGroups: string[] }) => Promise<void>;
  setRoomCapacity: (roomId: string, capacity: number) => Promise<void>;
  assignBalancedTeams: (minimumGroups: number, targetSize: number) => Promise<TeamAssignmentPlan>;
  jeopardySets: JeopardySetSummary[];
  createJeopardySet: (title: string, cards: JeopardyCardInput[]) => Promise<void>;
  activateJeopardySet: (setId: string | null) => Promise<void>;
  resolveJeopardyManually: (teamId: TeamId | null, multiplier: -1 | 0 | 1) => Promise<void>;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}
