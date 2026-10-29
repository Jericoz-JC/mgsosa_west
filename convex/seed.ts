import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { questions, teams } from "../lib/game/seed";
import { DEFAULT_EVENT_CODE, gameEvents } from "../lib/game/event-config";
import { assertHostPin } from "./security";

/**
 * Creates or refreshes one Game Mode event from lib/game/event-config.ts.
 * Re-running is safe: missing rooms and questions are added, existing
 * questions are refreshed in place, and scores and participants are kept.
 */
export const event = mutation({
  args: { hostPin: v.union(v.string(), v.number()), eventCode: v.optional(v.string()) },
  handler: async (ctx, args) => {
    assertHostPin(String(args.hostPin));
    const code = (args.eventCode ?? DEFAULT_EVENT_CODE).trim().toUpperCase();
    const config = gameEvents[code];
    if (!config) throw new ConvexError(`No event config for ${code}. Add it to lib/game/event-config.ts first.`);

    let eventId = (await ctx.db.query("events").withIndex("by_code", (q) => q.eq("code", code)).unique())?._id;
    if (!eventId) {
      eventId = await ctx.db.insert("events", {
        code,
        title: config.title,
        phase: "lobby",
        phaseStartedAt: Date.now(),
        activeRoomMessage: config.runOfShow[0]?.message ?? "Welcome • Check your team and rotation",
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
    } else {
      await ctx.db.patch(eventId, { title: config.title });
    }

    const existingRooms = await ctx.db.query("breakoutRooms").withIndex("by_event", (q) => q.eq("eventId", eventId)).collect();
    for (const room of existingRooms) {
      if (room.capacity === undefined) await ctx.db.patch(room._id, { capacity: 12 });
    }
    for (const template of config.rooms) {
      if (existingRooms.some((room) => room.name === template.name)) continue;
      await ctx.db.insert("breakoutRooms", {
        eventId,
        ...template,
        hostName: "Room host needed",
        status: "open",
        capacity: 12,
      });
    }

    const existingQuestions = await ctx.db.query("questions").withIndex("by_event", (q) => q.eq("eventId", eventId)).collect();
    const bySource = new Map(existingQuestions.map((question) => [question.sourceId, question]));
    for (const question of questions) {
      const values = {
        sourceId: question.sourceId,
        category: question.category,
        value: question.value,
        clue: question.clue,
        answer: question.answer,
        ageBand: question.ageBand,
        round: question.round,
      };
      const found = bySource.get(question.sourceId);
      if (found) await ctx.db.patch(found._id, values);
      else await ctx.db.insert("questions", { eventId, ...values, used: false });
    }

    const game = await ctx.db.query("jeopardyGames").withIndex("by_event", (q) => q.eq("eventId", eventId)).unique();
    if (game && game.activeRound === undefined) await ctx.db.patch(game._id, { activeRound: 1 });
    if (!game) await ctx.db.insert("jeopardyGames", { eventId, activeRound: 1 });
    return eventId;
  },
});
