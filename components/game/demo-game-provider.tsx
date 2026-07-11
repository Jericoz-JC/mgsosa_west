"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { gameReducer } from "@/lib/game/engine";
import { buildRoomHostLink, generateRoomHostToken } from "@/lib/game/room-host";
import { createSeedState } from "@/lib/game/seed";
import type { EventState, GameAction, ParticipantRoom } from "@/lib/game/types";
import { GameContext, type GameContextValue, type JoinRequest } from "./game-context";

const STORAGE_KEY = "mgsosa-west-demo-state-v1";
const CHANNEL_NAME = "mgsosa-west-demo-channel";

function initializer() {
  return createSeedState(1720742400000);
}

export function DemoGameProvider({ children }: { children: React.ReactNode }) {
  const [state, baseDispatch] = useReducer(gameReducer, undefined, initializer);
  const [hydrated, setHydrated] = useState(false);
  const [roomMembership, setRoomMembership] = useState<{
    room: ParticipantRoom;
    phaseStartedAt: number;
  }>();
  const currentRoom =
    (state.phase === "rotation-one" || state.phase === "rotation-two") &&
    roomMembership?.phaseStartedAt === state.phaseStartedAt
      ? roomMembership.room
      : null;

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

  const joinRoom = useCallback(async (code: string) => {
    const room = state.breakoutRooms.find((candidate) => candidate.code === code.trim());
    if (!room || !["open", "in-progress"].includes(room.status)) {
      throw new Error("Room code not found or no longer open.");
    }
    setRoomMembership({
      phaseStartedAt: state.phaseStartedAt,
      room: {
        id: room.id,
        name: room.name,
        game: room.game,
        status: room.status,
        rotationGroups: room.rotationGroups,
        externalUrl: room.externalUrl,
        capacity: room.capacity,
      },
    });
  }, [state.breakoutRooms, state.phaseStartedAt]);

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
      currentRoom,
      join,
      joinRoom,
      hostPin: "demo",
      submitHostPin: async () => true,
      clearHostPin: () => {},
      roomHostView: null,
      activateRoomHost: () => {},
      clearRoomHost: () => {},
      issueRoomHostLink: async () => buildRoomHostLink(window.location.origin, generateRoomHostToken()),
      revokeRoomHostLink: async () => {},
      setRoomCode: async (roomId, code) => dispatch({ type: "set-room-code", roomId, code }),
      awardRoomResult: async (_roomId, teamId, reason, idempotencyKey) => {
        dispatch({ type: "adjust-score", teamId, delta: 200, reason, idempotencyKey, at: Date.now() });
      },
      clearParticipants: async () => {
        const count = state.players.filter((player) => player.role === "participant").length;
        dispatch({ type: "hydrate", state: { ...state, players: state.players.filter((player) => player.role !== "participant") } });
        return count;
      },
      createRoom: async (input) => {
        dispatch({ type: "hydrate", state: { ...state, breakoutRooms: [...state.breakoutRooms, {
          id: `demo-room-${Date.now()}`, name: input.name, game: input.game, capacity: input.capacity,
          code: String(Math.floor(10000 + Math.random() * 90000)), hostName: "Room host needed",
          status: "open", rotationGroups: input.rotationGroups,
        }] } });
      },
      setRoomCapacity: async (roomId, capacity) => {
        dispatch({ type: "hydrate", state: { ...state, breakoutRooms: state.breakoutRooms.map((room) => room.id === roomId ? { ...room, capacity } : room) } });
      },
    }),
    [state, dispatch, reset, currentRoom, join, joinRoom],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
