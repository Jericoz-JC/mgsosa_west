"use client";

import { createContext, useContext } from "react";
import type { EventState, GameAction, TeamId } from "@/lib/game/types";

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
  join: (input: JoinRequest) => Promise<void>;
  /** Host PIN entered on this device. Demo mode is always authorized. */
  hostPin: string | null;
  submitHostPin: (pin: string) => Promise<boolean>;
  clearHostPin: () => void;
  setRoomCode: (roomId: string, code: string) => Promise<void>;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}
