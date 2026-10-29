"use client";

import { useCallback, useEffect, useState } from "react";
import { useConvex, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { generateRoomHostToken } from "@/lib/game/room-host";

export type StaffRole = "game-master" | "qa-admin";

export interface StaffSignInResult {
  ok: boolean;
  reason?: string;
}

/**
 * Holds a server-issued staff session for this tab. The PIN is sent once to
 * `staff.signIn` and never stored; the tab keeps only a random session token
 * that the server can expire or revoke.
 */
export function useStaffSession(role: StaffRole) {
  const convex = useConvex();
  const signInMutation = useMutation(api.staff.signIn);
  const signOutMutation = useMutation(api.staff.signOut);
  const storageKey = `mgsosa-west-staff-session-${role}`;
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) {
      queueMicrotask(() => { if (!cancelled) setReady(true); });
      return () => { cancelled = true; };
    }
    void convex.query(api.staff.check, { role, token: stored })
      .then((valid) => {
        if (cancelled) return;
        if (valid) setToken(stored);
        else window.sessionStorage.removeItem(storageKey);
      })
      .catch(() => window.sessionStorage.removeItem(storageKey))
      .finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [convex, role, storageKey]);

  const signIn = useCallback(async (pin: string): Promise<StaffSignInResult> => {
    const next = generateRoomHostToken();
    const result = await signInMutation({ role, pin, token: next });
    if (!result.ok) return result;
    window.sessionStorage.setItem(storageKey, next);
    setToken(next);
    return { ok: true };
  }, [role, signInMutation, storageKey]);

  /** Forgets the session locally; pass revoke to also end it on the server. */
  const clear = useCallback((revoke = true) => {
    const current = window.sessionStorage.getItem(storageKey);
    window.sessionStorage.removeItem(storageKey);
    setToken(null);
    if (revoke && current) void signOutMutation({ token: current }).catch(() => {});
  }, [signOutMutation, storageKey]);

  return { token, ready, signIn, clear };
}
