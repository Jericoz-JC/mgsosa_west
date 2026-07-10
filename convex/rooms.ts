import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertHostPin } from "./security";

export const setCode = mutation({
  args: { roomId: v.id("breakoutRooms"), code: v.string(), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    if (!/^\d{4,6}$/.test(args.code)) throw new ConvexError("Room codes must contain 4 to 6 digits.");
    const conflict = await ctx.db.query("breakoutRooms").withIndex("by_code", (q) => q.eq("code", args.code)).unique();
    if (conflict && conflict._id !== args.roomId) throw new ConvexError("That room code is already active.");
    await ctx.db.patch(args.roomId, { code: args.code });
  },
});

export const joinRoom = mutation({
  args: { code: v.string(), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db.query("breakoutRooms").withIndex("by_code", (q) => q.eq("code", args.code)).unique();
    if (!room || room.status === "closed") throw new ConvexError("Room code not found or no longer open.");
    const player = await ctx.db.query("players").withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken)).unique();
    if (!player || player.eventId !== room.eventId) throw new ConvexError("Join the main event first.");
    const memberships = await ctx.db.query("roomMembers").withIndex("by_player", (q) => q.eq("playerId", player._id)).collect();
    const existing = memberships.find((membership) => membership.roomId === room._id);
    if (!existing) await ctx.db.insert("roomMembers", { roomId: room._id, playerId: player._id, joinedAt: Date.now() });
    return room._id;
  },
});

export const roomPublicState = query({
  args: { roomId: v.id("breakoutRooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;
    const members = await ctx.db.query("roomMembers").withIndex("by_room", (q) => q.eq("roomId", room._id)).collect();
    const players = await Promise.all(members.map((member) => ctx.db.get(member.playerId)));
    return { room, players: players.filter(Boolean).map((player) => ({ _id: player!._id, name: player!.name, church: player!.church, teamId: player!.teamId })) };
  },
});
