import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { questions, teams } from "../lib/game/seed";
import { assertHostPin } from "./security";

export const event = mutation({
  args: { hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const existing = await ctx.db.query("events").withIndex("by_code", (q) => q.eq("code", "WEST26")).unique();
    if (existing) return existing._id;
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
    });
    await ctx.db.insert("breakoutRooms", {
      eventId,
      name: "Gartic • Sierra",
      game: "gartic",
      code: "73106",
      hostName: "Room host needed",
      status: "open",
      rotationGroups: ["B", "D"],
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
        used: false,
      });
    }
    await ctx.db.insert("jeopardyGames", { eventId });
    return eventId;
  },
});
