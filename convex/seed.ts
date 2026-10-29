import { ConvexError, v } from "convex/values";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { questions, teams } from "../lib/game/seed";
import { gameEvents } from "../lib/game/event-config";

/**
 * Server-only event setup. These are internal functions, so they can be run
 * only from the Convex CLI or dashboard by someone with deployment access;
 * no PIN is passed around and nothing in the browser can call them.
 *
 *   pnpm exec convex run seed:event '{"eventCode":"WINTER27"}' --prod
 *   pnpm exec convex run seed:endEvent --prod
 */
async function setActiveEvent(ctx: MutationCtx, activeEventCode: string | undefined) {
  const settings = await ctx.db.query("siteSettings").withIndex("by_key", (q) => q.eq("key", "main")).unique();
  if (settings) await ctx.db.patch(settings._id, { activeEventCode });
  else await ctx.db.insert("siteSettings", { key: "main", activeEventCode });
}

/**
 * Creates or refreshes one Game Mode event from lib/game/event-config.ts and,
 * by default, makes it the live event. Re-running is safe: missing rooms and
 * questions are added, existing questions are refreshed in place, and scores
 * and participants are kept.
 */
export const event = internalMutation({
  args: { eventCode: v.string(), activate: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const code = args.eventCode.trim().toUpperCase();
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

    if (args.activate !== false) await setActiveEvent(ctx, code);
    return { eventId, code, active: args.activate !== false };
  },
});

/** Ends Game Mode: /game shows "no game night right now" until the next event is activated. */
export const endEvent = internalMutation({
  args: {},
  handler: async (ctx) => {
    await setActiveEvent(ctx, undefined);
    return { active: null };
  },
});
