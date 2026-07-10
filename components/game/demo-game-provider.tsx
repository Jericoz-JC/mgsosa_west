"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { gameReducer } from "@/lib/game/engine";
import { createSeedState } from "@/lib/game/seed";
import type { EventState, GameAction } from "@/lib/game/types";

interface DemoGameContextValue {
  state: EventState;
  dispatch: (action: GameAction) => void;
  reset: () => void;
}

const DemoGameContext = createContext<DemoGameContextValue | null>(null);
const STORAGE_KEY = "mgsosa-west-demo-state-v1";
const CHANNEL_NAME = "mgsosa-west-demo-channel";

function initializer() {
  if (typeof window === "undefined") return createSeedState(1720742400000);
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as EventState) : createSeedState();
  } catch {
    return createSeedState();
  }
}

export function DemoGameProvider({ children }: { children: React.ReactNode }) {
  const [state, baseDispatch] = useReducer(gameReducer, undefined, initializer);

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

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<GameAction>) => baseDispatch(event.data);
    return () => channel.close();
  }, []);

  const value = useMemo(() => ({ state, dispatch, reset }), [state, dispatch, reset]);
  return <DemoGameContext.Provider value={value}>{children}</DemoGameContext.Provider>;
}

export function useDemoGame() {
  const context = useContext(DemoGameContext);
  if (!context) throw new Error("useDemoGame must be used within DemoGameProvider");
  return context;
}
