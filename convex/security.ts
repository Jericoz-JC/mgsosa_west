import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const ROOM_HOST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

export function assertHostPin(hostPin: string) {
  const expected = process.env.HOST_PIN;
  if (!expected) throw new ConvexError("HOST_PIN is not configured for this deployment.");
  if (hostPin !== expected) throw new ConvexError("Host access denied.");
}

export function assertRoomHostTokenFormat(token: string) {
  if (!ROOM_HOST_TOKEN_PATTERN.test(token)) {
    throw new ConvexError("Room host link is invalid or expired.");
  }
}

export async function hashRoomHostToken(token: string) {
  assertRoomHostTokenFormat(token);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function assertRoomHostGrant(ctx: QueryCtx | MutationCtx, token: string) {
  const tokenHash = await hashRoomHostToken(token);
  const grant = await ctx.db
    .query("roomHostGrants")
    .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
    .first();
  if (!grant || grant.revokedAt !== undefined || grant.expiresAt <= Date.now()) {
    throw new ConvexError("Room host link is invalid or expired.");
  }
  const [room, event] = await Promise.all([ctx.db.get(grant.roomId), ctx.db.get(grant.eventId)]);
  if (!room || !event || room.eventId !== event._id) {
    throw new ConvexError("Room host link is invalid or expired.");
  }
  return { grant, room, event };
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}
