"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { gameReducer } from "@/lib/game/engine";
import { createSeedState } from "@/lib/game/seed";
import type { EventState, GameAction } from "@/lib/game/types";
import { GameContext, type GameContextValue, type JoinRequest } from "./game-context";

const STORAGE_KEY = "mgsosa-west-demo-state-v1";
const CHANNEL_NAME = "mgsosa-west-demo-channel";

function initializer() {
  return createSeedState(1720742400000);
}

export function DemoGameProvider({ children }: { children: React.ReactNode }) {
  const [state, baseDispatch] = useReducer(gameReducer, undefined, initializer);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) baseDispatch({ type: "hydrate", state: JSON.parse(stored) as EventState });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  const dispatch = useCallback((action: GameAction) => {
    baseDispatch(action);
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage(action);
      channel.close();
    }
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  const join = useCallback(async (input: JoinRequest) => {
    window.localStorage.setItem(
      "mgsosa-west-player",
      JSON.stringify({ ...input, playerId: "player-maya", teamId: "pacific", rotationGroup: "A" }),
    );
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<GameAction>) => baseDispatch(event.data);
    return () => channel.close();
  }, []);

  const value = useMemo<GameContextValue>(
    () => ({
      mode: "demo",
      state,
      dispatch,
      reset,
      identity: null,
      join,
      hostPin: "demo",
      roomPin: "demo",
      submitHostPin: async () => true,
      submitRoomPin: async () => true,
      clearHostPin: () => {},
      clearRoomPin: () => {},
      setRoomCode: async () => {},
    }),
    [state, dispatch, reset, join],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
