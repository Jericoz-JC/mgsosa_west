import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertHostPin, normalizeCode } from "./security";

export const verifyHostPin = query({
  args: { hostPin: v.string() },
  handler: async (_ctx, args) => {
    const expected = process.env.HOST_PIN;
    return Boolean(expected) && args.hostPin === expected;
  },
});

export const join = mutation({
  args: {
    eventCode: v.string(),
    sessionToken: v.string(),
    name: v.string(),
    church: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.sessionToken.length < 24) throw new ConvexError("Invalid participant session.");
    const event = await ctx.db
      .query("events")
      .withIndex("by_code", (q) => q.eq("code", normalizeCode(args.eventCode)))
      .unique();
    if (!event) throw new ConvexError("Event code not found.");

    const existing = await ctx.db
      .query("players")
      .withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken))
      .unique();
    if (existing) {
      if (existing.eventId !== event._id) {
        throw new ConvexError("This participant session belongs to another event.");
      }
      await ctx.db.patch(existing._id, {
        name: args.name.trim().slice(0, 32),
        church: args.church.trim().slice(0, 64),
        lastSeenAt: Date.now(),
      });
      return existing._id;
    }

    const teams = await ctx.db.query("teams").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect();
    if (!teams.length) throw new ConvexError("Teams are not ready yet.");
    const players = await ctx.db.query("players").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect();
    const counts = new Map(teams.map((team) => [team._id, 0]));
    for (const player of players) counts.set(player.teamId, (counts.get(player.teamId) ?? 0) + 1);
    const team = [...teams].sort((a, b) => (counts.get(a._id) ?? 0) - (counts.get(b._id) ?? 0))[0];
    const rotationGroup = ["A", "B", "C", "D"][players.length % 4];

    return await ctx.db.insert("players", {
      eventId: event._id,
      sessionToken: args.sessionToken,
      name: args.name.trim().slice(0, 32),
      church: args.church.trim().slice(0, 64),
      teamId: team._id,
      role: "participant",
      rotationGroup,
      lastSeenAt: Date.now(),
    });
  },
});

export const me = query({
  args: { sessionToken: v.string(), eventCode: v.string() },
  handler: async (ctx, args) => {
    if (args.sessionToken.length < 24) return null;
    const [event, player] = await Promise.all([
      ctx.db
        .query("events")
        .withIndex("by_code", (q) => q.eq("code", normalizeCode(args.eventCode)))
        .unique(),
      ctx.db
        .query("players")
        .withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken))
        .unique(),
    ]);
    if (!event || !player || player.eventId !== event._id) return null;
    const team = await ctx.db.get(player.teamId);
    let currentRoom = null;
    if (event.phase === "rotation-one" || event.phase === "rotation-two") {
      const memberships = await ctx.db
        .query("roomMembers")
        .withIndex("by_player", (q) => q.eq("playerId", player._id))
        .collect();
      const membership = memberships
        .filter((candidate) => candidate.joinedAt >= event.phaseStartedAt)
        .sort((a, b) => b.joinedAt - a.joinedAt)[0];
      if (membership) {
        const room = await ctx.db.get(membership.roomId);
        if (room?.eventId === event._id) {
          currentRoom = {
            roomId: room._id,
            name: room.name,
            game: room.game,
            status: room.status,
            rotationGroups: room.rotationGroups,
            externalUrl: room.externalUrl,
          };
        }
      }
    }
    return {
      playerId: player._id,
      eventId: player.eventId,
      name: player.name,
      church: player.church,
      teamId: player.teamId,
      teamSlug: team?.slug ?? null,
      role: player.role,
      rotationGroup: player.rotationGroup,
      currentRoom,
    };
  },
});

export const publicState = query({
  args: { eventCode: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_code", (q) => q.eq("code", normalizeCode(args.eventCode)))
      .unique();
    if (!event) return null;
    const [teams, rooms, questions, scoreEvents, game] = await Promise.all([
      ctx.db.query("teams").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect(),
      ctx.db.query("breakoutRooms").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect(),
      ctx.db.query("questions").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect(),
      ctx.db.query("scoreEvents").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect(),
      ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", event._id)).unique(),
    ]);
    const buzzWindow = game?.currentBuzzWindowId ? await ctx.db.get(game.currentBuzzWindowId) : null;
    const winner = buzzWindow?.winnerPlayerId ? await ctx.db.get(buzzWindow.winnerPlayerId) : null;
    return {
      event,
      teams,
      rooms: rooms.map((room) => ({
        _id: room._id,
        _creationTime: room._creationTime,
        eventId: room.eventId,
        name: room.name,
        game: room.game,
        code: "",
        hostName: room.hostName,
        status: room.status,
        rotationGroups: room.rotationGroups,
        externalUrl: undefined,
      })),
      questions: questions.map((question) => ({
        _id: question._id,
        _creationTime: question._creationTime,
        eventId: question.eventId,
        sourceId: question.sourceId,
        category: question.category,
        value: question.value,
        clue: question.clue,
        ageBand: question.ageBand,
        used: question.used,
      })),
      scoreEvents,
      game,
      buzzWindow,
      winner: winner ? { _id: winner._id, name: winner.name, teamId: winner.teamId } : null,
    };
  },
});

export const setPhase = mutation({
  args: { eventId: v.id("events"), hostPin: v.string(), phase: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    await ctx.db.patch(args.eventId, {
      phase: args.phase,
      activeRoomMessage: args.message,
      phaseStartedAt: Date.now(),
    });
  },
});
