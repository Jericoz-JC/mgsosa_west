import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertHostPin } from "./security";

export const hostState = query({
  args: { eventId: v.id("events"), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique();
    const questions = await ctx.db.query("questions").withIndex("by_event_set", (q) => q.eq("eventId", args.eventId).eq("setId", game?.activeSetId)).collect();
    const buzzWindow = game?.currentBuzzWindowId ? await ctx.db.get(game.currentBuzzWindowId) : null;
    return { game, questions, buzzWindow };
  },
});

export const listSets = query({
  args: { eventId: v.id("events"), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const [game, sets, questions] = await Promise.all([
      ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique(),
      ctx.db.query("jeopardySets").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
      ctx.db.query("questions").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect(),
    ]);
    return [
      {
        id: null,
        title: "Built-in Holy Qurbana boards",
        questionCount: questions.filter((question) => question.setId === undefined).length,
        active: game?.activeSetId === undefined,
      },
      ...sets
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((set) => ({
          id: set._id,
          title: set.title,
          questionCount: questions.filter((question) => question.setId === set._id).length,
          active: game?.activeSetId === set._id,
        })),
    ];
  },
});

export const createSet = mutation({
  args: {
    eventId: v.id("events"),
    hostPin: v.string(),
    title: v.string(),
    cards: v.array(v.object({ category: v.string(), value: v.number(), clue: v.string(), answer: v.string() })),
  },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const title = args.title.trim().replace(/\s+/g, " ");
    if (title.length < 3 || title.length > 80) throw new ConvexError("Give the game set a short title.");
    if (args.cards.length < 1 || args.cards.length > 60) throw new ConvexError("A set must contain between 1 and 60 cards.");
    const normalized = args.cards.map((card) => ({
      category: card.category.trim().replace(/\s+/g, " "),
      value: card.value,
      clue: card.clue.trim().replace(/\s+/g, " "),
      answer: card.answer.trim().replace(/\s+/g, " "),
    }));
    for (const card of normalized) {
      if (card.category.length < 2 || card.category.length > 40) throw new ConvexError("Every category must be 2 to 40 characters.");
      if (!Number.isInteger(card.value) || card.value < 1 || card.value > 5000) throw new ConvexError("Card values must be whole numbers from 1 to 5000.");
      if (card.clue.length < 3 || card.clue.length > 500) throw new ConvexError("Every clue must be 3 to 500 characters.");
      if (card.answer.length < 1 || card.answer.length > 300) throw new ConvexError("Every card needs an answer.");
    }
    const setId = await ctx.db.insert("jeopardySets", { eventId: args.eventId, title, createdAt: Date.now() });
    for (let index = 0; index < normalized.length; index += 1) {
      const card = normalized[index];
      await ctx.db.insert("questions", {
        eventId: args.eventId,
        setId,
        sourceId: `CUSTOM-${String(index + 1).padStart(3, "0")}`,
        category: card.category,
        value: card.value,
        clue: card.clue,
        answer: card.answer,
        ageBand: "All ages",
        round: 1,
        used: false,
      });
    }
    const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique();
    if (!game) throw new ConvexError("Jeopardy is not initialized.");
    await ctx.db.patch(game._id, { activeSetId: setId, activeRound: 1, currentQuestionId: undefined, currentBuzzWindowId: undefined });
    return setId;
  },
});

export const activateSet = mutation({
  args: { eventId: v.id("events"), hostPin: v.string(), setId: v.union(v.id("jeopardySets"), v.null()) },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    if (args.setId) {
      const set = await ctx.db.get(args.setId);
      if (!set || set.eventId !== args.eventId) throw new ConvexError("Game set not found.");
    }
    const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique();
    if (!game) throw new ConvexError("Jeopardy is not initialized.");
    await ctx.db.patch(game._id, {
      activeSetId: args.setId ?? undefined,
      activeRound: 1,
      currentQuestionId: undefined,
      currentBuzzWindowId: undefined,
    });
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
    if ((game.activeSetId && question.setId !== game.activeSetId) || (!game.activeSetId && question.setId !== undefined)) {
      throw new ConvexError("That clue belongs to another game set.");
    }
    if ((question.round ?? 1) !== (game.activeRound ?? 1)) throw new ConvexError("That clue belongs to the other round.");
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

export const setRound = mutation({
  args: { eventId: v.id("events"), round: v.union(v.literal(1), v.literal(2)), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique();
    if (!game) throw new ConvexError("Jeopardy is not initialized.");
    if (game.activeSetId && args.round !== 1) throw new ConvexError("Custom game sets use one board.");
    await ctx.db.patch(game._id, { activeRound: args.round, currentQuestionId: undefined, currentBuzzWindowId: undefined });
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
    if (!player.teamId) throw new ConvexError("Teams have not been assigned yet.");
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
    if (!player.teamId) throw new ConvexError("The winning participant is not assigned to a team.");
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

export const resolveManual = mutation({
  args: {
    eventId: v.id("events"),
    hostPin: v.string(),
    teamId: v.union(v.id("teams"), v.null()),
    multiplier: v.union(v.literal(-1), v.literal(0), v.literal(1)),
  },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).unique();
    if (!game?.currentQuestionId) throw new ConvexError("Select a clue first.");
    const question = await ctx.db.get(game.currentQuestionId);
    if (!question || question.eventId !== args.eventId || question.used) throw new ConvexError("This clue is unavailable.");
    if (args.multiplier !== 0) {
      if (!args.teamId) throw new ConvexError("Choose a team for this score.");
      const team = await ctx.db.get(args.teamId);
      if (!team || team.eventId !== args.eventId || team.active === false) throw new ConvexError("That team is unavailable.");
      await ctx.db.insert("scoreEvents", {
        eventId: args.eventId,
        teamId: team._id,
        delta: question.value * args.multiplier,
        reason: `${team.shortName} ${args.multiplier > 0 ? "won" : "lost"} ${question.category} for ${question.value} (manual)`,
        questionId: question._id,
        createdAt: Date.now(),
      });
    }
    await ctx.db.patch(question._id, { used: true });
    await ctx.db.patch(game._id, { currentQuestionId: undefined, currentBuzzWindowId: undefined });
  },
});
