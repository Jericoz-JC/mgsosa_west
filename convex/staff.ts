import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { findStaffSession, sha256Hex, staffPinFor } from "./security";

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;

const roleValidator = v.union(v.literal("game-master"), v.literal("qa-admin"));

/**
 * Exchanges a staff PIN for a session. The browser generates the random token
 * and only its hash is stored, matching the room-host link pattern. Failures
 * return instead of throwing so the attempt record is kept for rate limiting.
 */
export const signIn = mutation({
  args: { role: roleValidator, pin: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    if (!/^[a-f0-9]{48}$/.test(args.token)) return { ok: false as const, reason: "Refresh the page and try again." };
    const expected = staffPinFor(args.role);
    if (!expected) {
      return {
        ok: false as const,
        reason: args.role === "game-master" ? "Game Master access isn’t set up yet." : "Ask the Clergy moderation isn’t set up yet.",
      };
    }
    const now = Date.now();
    const recentFailures = (await ctx.db.query("staffSignInAttempts").withIndex("by_role", (q) => q.eq("role", args.role)).collect())
      .filter((attempt) => now - attempt.failedAt < ATTEMPT_WINDOW_MS);
    if (recentFailures.length >= MAX_FAILED_ATTEMPTS) {
      return { ok: false as const, reason: "Too many wrong PINs. Wait 15 minutes and try again." };
    }
    if (args.pin.trim() !== expected) {
      await ctx.db.insert("staffSignInAttempts", { role: args.role, failedAt: now });
      return { ok: false as const, reason: "That PIN was not accepted." };
    }
    for (const attempt of recentFailures) await ctx.db.delete(attempt._id);
    const expired = (await ctx.db.query("staffSessions").withIndex("by_role", (q) => q.eq("role", args.role)).collect())
      .filter((session) => session.expiresAt <= now);
    for (const session of expired) await ctx.db.delete(session._id);
    await ctx.db.insert("staffSessions", {
      role: args.role,
      tokenHash: await sha256Hex(args.token),
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });
    return { ok: true as const };
  },
});

export const check = query({
  args: { role: roleValidator, token: v.string() },
  handler: async (ctx, args) => Boolean(await findStaffSession(ctx, args.role, args.token)),
});

export const signOut = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!/^[a-f0-9]{48}$/.test(args.token)) return;
    const tokenHash = await sha256Hex(args.token);
    const session = await ctx.db.query("staffSessions").withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash)).unique();
    if (session) await ctx.db.delete(session._id);
  },
});
