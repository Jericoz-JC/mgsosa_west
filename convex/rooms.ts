import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  assertHostPin,
  assertRoomHostGrant,
  assertRoomHostTokenFormat,
  hashRoomHostToken,
} from "./security";

// Links created during the day-before walkthrough must remain valid through
// the following evening's event, while still expiring soon after game night.
const ROOM_HOST_GRANT_TTL_MS = 72 * 60 * 60 * 1000;

function normalizeRoomCode(code: string) {
  const normalized = code.trim();
  if (!/^\d{4,6}$/.test(normalized)) {
    throw new ConvexError("Room codes must contain 4 to 6 digits.");
  }
  return normalized;
}

function participantRoom(room: Doc<"breakoutRooms">) {
  return {
    roomId: room._id,
    name: room.name,
    game: room.game,
    status: room.status,
    rotationGroups: room.rotationGroups,
    externalUrl: room.externalUrl,
  };
}

async function updateRoomCode(ctx: MutationCtx, room: Doc<"breakoutRooms">, input: string) {
  const code = normalizeRoomCode(input);
  const conflict = await ctx.db
    .query("breakoutRooms")
    .withIndex("by_event_code", (q) => q.eq("eventId", room.eventId).eq("code", code))
    .unique();
  if (conflict && conflict._id !== room._id) {
    throw new ConvexError("That room code is already active for this event.");
  }
  await ctx.db.patch(room._id, { code });
  return code;
}

export const joinRoom = mutation({
  args: { code: v.string(), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim();
    if (!/^\d{4,6}$/.test(code)) {
      return { ok: false as const, error: "Room codes must contain 4 to 6 digits." };
    }
    if (args.sessionToken.length < 24) {
      return { ok: false as const, error: "Join the main event first." };
    }

    const player = await ctx.db
      .query("players")
      .withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken))
      .unique();
    if (!player) return { ok: false as const, error: "Join the main event first." };

    const room = await ctx.db
      .query("breakoutRooms")
      .withIndex("by_event_code", (q) => q.eq("eventId", player.eventId).eq("code", code))
      .unique();
    if (!room || (room.status !== "open" && room.status !== "in-progress")) {
      return { ok: false as const, error: "Room code not found or no longer open." };
    }

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_player", (q) => q.eq("playerId", player._id))
      .collect();
    for (const membership of memberships) {
      const existingRoom = await ctx.db.get(membership.roomId);
      if (!existingRoom || existingRoom.eventId === player.eventId) {
        await ctx.db.delete(membership._id);
      }
    }

    const now = Date.now();
    await ctx.db.insert("roomMembers", { roomId: room._id, playerId: player._id, joinedAt: now });
    await ctx.db.patch(player._id, { lastSeenAt: now });
    return { ok: true as const, room: participantRoom(room) };
  },
});

export const hostState = query({
  args: { eventId: v.id("events"), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new ConvexError("Event not found.");
    const rooms = await ctx.db
      .query("breakoutRooms")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const players = await ctx.db
      .query("players")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();
    const now = Date.now();
    return {
      players: players.filter((player) => player.role === "participant").map((player) => ({
        playerId: player._id,
        name: player.name,
        church: player.church,
        teamId: player.teamId,
        rotationGroup: player.rotationGroup,
        lastSeenAt: player.lastSeenAt,
      })),
      rooms: await Promise.all(
        rooms.map(async (room) => {
          const grants = await ctx.db
            .query("roomHostGrants")
            .withIndex("by_room", (q) => q.eq("roomId", room._id))
            .collect();
          const activeGrant = grants
            .filter((grant) => grant.revokedAt === undefined && grant.expiresAt > now)
            .sort((a, b) => b.createdAt - a.createdAt)[0];
          return {
            ...room,
            hostGrantActive: Boolean(activeGrant),
            hostGrantExpiresAt: activeGrant?.expiresAt,
          };
        }),
      ),
    };
  },
});

export const expireHostGrant = internalMutation({
  args: { grantId: v.id("roomHostGrants") },
  handler: async (ctx, args) => {
    const grant = await ctx.db.get(args.grantId);
    if (!grant || grant.revokedAt !== undefined) return;
    const now = Date.now();
    if (grant.expiresAt > now) {
      await ctx.scheduler.runAt(grant.expiresAt, internal.rooms.expireHostGrant, { grantId: grant._id });
      return;
    }
    await ctx.db.patch(grant._id, { revokedAt: now });
  },
});

export const issueHostGrant = mutation({
  args: { roomId: v.id("breakoutRooms"), token: v.string(), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    assertRoomHostTokenFormat(args.token);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new ConvexError("Room not found.");

    const tokenHash = await hashRoomHostToken(args.token);
    const collision = await ctx.db
      .query("roomHostGrants")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .first();
    if (collision) throw new ConvexError("Create a new private room-host link and try again.");

    const now = Date.now();
    const existing = await ctx.db
      .query("roomHostGrants")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    for (const grant of existing) {
      if (grant.revokedAt === undefined) await ctx.db.patch(grant._id, { revokedAt: now });
    }

    const expiresAt = now + ROOM_HOST_GRANT_TTL_MS;
    const grantId = await ctx.db.insert("roomHostGrants", {
      eventId: room.eventId,
      roomId: room._id,
      tokenHash,
      createdAt: now,
      expiresAt,
    });
    await ctx.scheduler.runAt(expiresAt, internal.rooms.expireHostGrant, { grantId });
    return { roomId: room._id, expiresAt };
  },
});

export const revokeHostGrant = mutation({
  args: { roomId: v.id("breakoutRooms"), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new ConvexError("Room not found.");
    const grants = await ctx.db
      .query("roomHostGrants")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();
    const now = Date.now();
    let revoked = 0;
    for (const grant of grants) {
      if (grant.revokedAt === undefined) {
        await ctx.db.patch(grant._id, { revokedAt: now });
        revoked += 1;
      }
    }
    return { roomId: room._id, revoked };
  },
});

export const roomHostState = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    let access;
    try {
      access = await assertRoomHostGrant(ctx, args.token);
    } catch (error) {
      if (error instanceof ConvexError) return null;
      throw error;
    }
    const { event, grant, room } = access;
    const [memberships, teams] = await Promise.all([
      ctx.db.query("roomMembers").withIndex("by_room", (q) => q.eq("roomId", room._id)).collect(),
      ctx.db.query("teams").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect(),
    ]);
    const currentMemberships =
      event.phase === "rotation-one" || event.phase === "rotation-two"
        ? memberships.filter((membership) => membership.joinedAt >= event.phaseStartedAt)
        : [];
    const players = await Promise.all(currentMemberships.map((membership) => ctx.db.get(membership.playerId)));
    return {
      room,
      event: {
        eventId: event._id,
        phase: event.phase,
        phaseStartedAt: event.phaseStartedAt,
      },
      grantExpiresAt: grant.expiresAt,
      teams,
      players: players
        .filter((player) => player?.eventId === event._id)
        .map((player) => ({
          playerId: player!._id,
          name: player!.name,
          church: player!.church,
          teamId: player!.teamId,
          rotationGroup: player!.rotationGroup,
        })),
    };
  },
});

export const setCodeAsHost = mutation({
  args: { roomId: v.id("breakoutRooms"), code: v.string(), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new ConvexError("Room not found.");
    return await updateRoomCode(ctx, room, args.code);
  },
});

export const setCodeAsRoomHost = mutation({
  args: { token: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const { room } = await assertRoomHostGrant(ctx, args.token);
    return await updateRoomCode(ctx, room, args.code);
  },
});

export const awardRoomResult = mutation({
  args: { token: v.string(), teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const { event, room } = await assertRoomHostGrant(ctx, args.token);
    if (event.phase !== "rotation-one" && event.phase !== "rotation-two") {
      throw new ConvexError("Room results can only be submitted during an active rotation.");
    }
    if (room.status !== "open" && room.status !== "in-progress") {
      throw new ConvexError("This breakout room is not open for scoring.");
    }
    const team = await ctx.db.get(args.teamId);
    if (!team || team.eventId !== event._id) {
      throw new ConvexError("That team does not belong to this event.");
    }

    const idempotencyKey = `room-award:${room._id}:${event.phaseStartedAt}`;
    const existing = await ctx.db
      .query("scoreEvents")
      .withIndex("by_event_idempotency", (q) =>
        q.eq("eventId", event._id).eq("idempotencyKey", idempotencyKey),
      )
      .unique();
    if (existing) return { scoreEventId: existing._id, created: false };

    const scoreEventId = await ctx.db.insert("scoreEvents", {
      eventId: event._id,
      teamId: team._id,
      delta: 200,
      reason: `${room.name} round winner`,
      idempotencyKey,
      createdAt: Date.now(),
    });
    return { scoreEventId, created: true };
  },
});
