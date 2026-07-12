import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { questions, teams } from "../lib/game/seed";
import { assertHostPin } from "./security";

export const event = mutation({
  args: { hostPin: v.union(v.string(), v.number()) },
  handler: async (ctx, args) => {
    assertHostPin(String(args.hostPin));
    const existing = await ctx.db.query("events").withIndex("by_code", (q) => q.eq("code", "WEST26")).unique();
    if (existing) {
      const existingRooms = await ctx.db.query("breakoutRooms").withIndex("by_event", (q) => q.eq("eventId", existing._id)).collect();
      for (const room of existingRooms) {
        if (room.capacity === undefined) await ctx.db.patch(room._id, { capacity: 12 });
      }
      const roomTemplates = [
        { name: "Imposter • Desert", game: "imposter" as const, code: "62514", rotationGroups: ["B", "D"] },
        { name: "Gartic • Valley", game: "gartic" as const, code: "84632", rotationGroups: ["A", "C"] },
      ];
      for (const template of roomTemplates) {
        if (!existingRooms.some((room) => room.name === template.name)) {
          await ctx.db.insert("breakoutRooms", {
            eventId: existing._id,
            ...template,
            hostName: "Room host needed",
            status: "open",
            capacity: 12,
          });
        }
      }
      const existingQuestions = await ctx.db.query("questions").withIndex("by_event", (q) => q.eq("eventId", existing._id)).collect();
      const bySource = new Map(existingQuestions.map((question) => [question.sourceId, question]));
      for (const question of questions) {
        const found = bySource.get(question.sourceId);
        const values = {
          sourceId: question.sourceId,
          category: question.category,
          value: question.value,
          clue: question.clue,
          answer: question.answer,
          ageBand: question.ageBand,
          round: question.round,
        };
        if (found) await ctx.db.patch(found._id, values);
        else await ctx.db.insert("questions", { eventId: existing._id, ...values, used: false });
      }
      const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", existing._id)).unique();
      if (game && game.activeRound === undefined) await ctx.db.patch(game._id, { activeRound: 1 });
      if (!game) await ctx.db.insert("jeopardyGames", { eventId: existing._id, activeRound: 1 });
      return existing._id;
    }
    const eventId = await ctx.db.insert("events", {
      code: "WEST26",
      title: "MGSOSA West Game Night",
      phase: "lobby",
      phaseStartedAt: Date.now(),
      activeRoomMessage: "Welcome • Check your team and rotation",
      subtractIncorrect: true,
      answerSeconds: 12,
    });
    for (const team of teams) {
      await ctx.db.insert("teams", {
        eventId,
        slug: team.id,
        name: team.name,
        shortName: team.shortName,
        color: team.color,
        accent: team.accent,
        active: true,
        position: teams.indexOf(team),
      });
    }
    await ctx.db.insert("breakoutRooms", {
      eventId,
      name: "Imposter • Pacific",
      game: "imposter",
      code: "48215",
      hostName: "Room host needed",
      status: "open",
      rotationGroups: ["A", "C"],
      capacity: 12,
    });
    await ctx.db.insert("breakoutRooms", {
      eventId,
      name: "Gartic • Sierra",
      game: "gartic",
      code: "73106",
      hostName: "Room host needed",
      status: "open",
      rotationGroups: ["B", "D"],
      capacity: 12,
    });
    for (const question of questions) {
      await ctx.db.insert("questions", {
        eventId,
        sourceId: question.sourceId,
        category: question.category,
        value: question.value,
        clue: question.clue,
        answer: question.answer,
        ageBand: question.ageBand,
        round: question.round,
        used: false,
      });
    }
    await ctx.db.insert("jeopardyGames", { eventId, activeRound: 1 });
    return eventId;
  },
});
