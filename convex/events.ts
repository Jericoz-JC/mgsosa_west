import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertHostPin, normalizeCode } from "./security";

export const join = mutation({
  args: {
    eventCode: v.string(),
    sessionToken: v.string(),
    name: v.string(),
    church: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.sessionToken.length < 24) throw new ConvexError("Invalid participant session.");
    const existing = await ctx.db
      .query("players")
      .withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeenAt: Date.now() });
      return existing._id;
    }

    const event = await ctx.db
      .query("events")
      .withIndex("by_code", (q) => q.eq("code", normalizeCode(args.eventCode)))
      .unique();
    if (!event) throw new ConvexError("Event code not found.");

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
      rooms,
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
