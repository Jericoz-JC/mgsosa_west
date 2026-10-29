import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const ROOM_HOST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

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

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export type StaffRole = "game-master" | "qa-admin";

/**
 * Staff PINs live only in Convex environment variables. Signing in exchanges
 * the PIN for a short-lived session token; the browser keeps the token, never
 * the PIN, and every staff function checks the token here.
 */
export function staffPinFor(role: StaffRole) {
  return role === "game-master" ? process.env.HOST_PIN : process.env.QA_ADMIN_PIN;
}

export async function findStaffSession(ctx: QueryCtx | MutationCtx, role: StaffRole, token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const tokenHash = await sha256Hex(token);
  const session = await ctx.db.query("staffSessions").withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash)).unique();
  if (!session || session.role !== role || session.expiresAt <= Date.now()) return null;
  return session;
}

export async function assertStaff(ctx: QueryCtx | MutationCtx, role: StaffRole, token: string) {
  const session = await findStaffSession(ctx, role, token);
  if (!session) throw new ConvexError("Staff session expired. Sign in again.");
  return session;
}

export function assertGameMaster(ctx: QueryCtx | MutationCtx, token: string) {
  return assertStaff(ctx, "game-master", token);
}
