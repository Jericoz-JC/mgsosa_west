import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertHostPin } from "./security";

export const hostState = query({
  args: { eventId: v.id("events"), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique();
    const questions = await ctx.db.query("questions").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect();
    const buzzWindow = game?.currentBuzzWindowId ? await ctx.db.get(game.currentBuzzWindowId) : null;
    return { game, questions, buzzWindow };
  },
});

export const selectQuestion = mutation({
  args: { eventId: v.id("events"), questionId: v.id("questions"), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const question = await ctx.db.get(args.questionId);
    if (!question || question.eventId !== args.eventId || question.used) throw new ConvexError("Question is unavailable.");
    const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique();
    if (!game) throw new ConvexError("Jeopardy is not initialized.");
    const windowId = await ctx.db.insert("buzzWindows", {
      eventId: args.eventId,
      questionId: question._id,
      status: "locked",
      attempt: 1,
      lockedTeamIds: [],
    });
    await ctx.db.patch(game._id, { currentQuestionId: question._id, currentBuzzWindowId: windowId });
  },
});

export const openBuzzers = mutation({
  args: { eventId: v.id("events"), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique();
    if (!game?.currentBuzzWindowId) throw new ConvexError("Select a question first.");
    const window = await ctx.db.get(game.currentBuzzWindowId);
    if (!window) throw new ConvexError("Buzzer window is missing.");
    if (window.status !== "locked") return;
    await ctx.db.patch(window._id, {
      status: "open",
      openedAt: Date.now(),
      attempt: window.openedAt ? window.attempt + 1 : window.attempt,
      winnerPlayerId: undefined,
      claimedAt: undefined,
    });
  },
});

export const returnToBoard = mutation({
  args: { eventId: v.id("events"), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique();
    if (!game) throw new ConvexError("Jeopardy is not initialized.");
    await ctx.db.patch(game._id, { currentQuestionId: undefined, currentBuzzWindowId: undefined });
  },
});

export const buzz = mutation({
  args: { eventId: v.id("events"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const player = await ctx.db.query("players").withIndex("by_session_token", (q) => q.eq("sessionToken", args.sessionToken)).unique();
    if (!player || player.eventId !== args.eventId) throw new ConvexError("Participant session not found.");
    const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique();
    if (!game?.currentBuzzWindowId) return { accepted: false, reason: "closed" } as const;
    const window = await ctx.db.get(game.currentBuzzWindowId);
    if (!window || window.status === "locked") return { accepted: false, reason: "closed" } as const;
    if (window.status === "claimed") return { accepted: false, reason: "already-claimed" } as const;
    if (window.lockedTeamIds.includes(player.teamId)) return { accepted: false, reason: "team-locked" } as const;

    // This read-and-patch runs as one serializable Convex mutation. Concurrent callers
    // cannot both commit as the winner of the same buzz window.
    await ctx.db.patch(window._id, {
      status: "claimed",
      winnerPlayerId: player._id,
      claimedAt: Date.now(),
    });
    return { accepted: true, reason: "accepted" } as const;
  },
});

export const judge = mutation({
  args: { eventId: v.id("events"), correct: v.boolean(), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const [event, game] = await Promise.all([
      ctx.db.get(args.eventId),
      ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique(),
    ]);
    if (!event || !game?.currentQuestionId || !game.currentBuzzWindowId) throw new ConvexError("No active clue.");
    const [question, window] = await Promise.all([ctx.db.get(game.currentQuestionId), ctx.db.get(game.currentBuzzWindowId)]);
    if (!question || !window?.winnerPlayerId || window.status !== "claimed") throw new ConvexError("No accepted buzz to judge.");
    const player = await ctx.db.get(window.winnerPlayerId);
    if (!player) throw new ConvexError("Winning player no longer exists.");
    const delta = args.correct ? question.value : event.subtractIncorrect ? -question.value : 0;
    if (delta !== 0) {
      await ctx.db.insert("scoreEvents", {
        eventId: args.eventId,
        teamId: player.teamId,
        delta,
        reason: `${player.name} ${args.correct ? "answered" : "missed"} ${question.category} for ${question.value}`,
        questionId: question._id,
        createdAt: Date.now(),
      });
    }
    if (args.correct) {
      await ctx.db.patch(question._id, { used: true });
      await ctx.db.patch(window._id, { status: "locked" });
    } else {
      await ctx.db.patch(window._id, {
        status: "locked",
        lockedTeamIds: Array.from(new Set([...window.lockedTeamIds, player.teamId])),
      });
    }
  },
});
