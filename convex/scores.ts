import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { assertGameMaster } from "./security";

export const adjust = mutation({
  args: {
    eventId: v.id("events"),
    teamId: v.id("teams"),
    delta: v.number(),
    reason: v.string(),
    staffToken: v.string(),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertGameMaster(ctx, args.staffToken);
    const [event, team] = await Promise.all([ctx.db.get(args.eventId), ctx.db.get(args.teamId)]);
    if (!event) throw new ConvexError("Event not found.");
    if (!team || team.eventId !== event._id) {
      throw new ConvexError("That team does not belong to this event.");
    }
    if (args.idempotencyKey) {
      const existing = await ctx.db
        .query("scoreEvents")
        .withIndex("by_event_idempotency", (q) =>
          q.eq("eventId", args.eventId).eq("idempotencyKey", args.idempotencyKey),
        )
        .unique();
      if (existing) return existing._id;
    }
    return await ctx.db.insert("scoreEvents", {
      eventId: args.eventId,
      teamId: args.teamId,
      delta: args.delta,
      reason: args.reason.trim().slice(0, 160),
      idempotencyKey: args.idempotencyKey,
      createdAt: Date.now(),
    });
  },
});

export const undoLast = mutation({
  args: { eventId: v.id("events"), staffToken: v.string() },
  handler: async (ctx, args) => {
    await assertGameMaster(ctx, args.staffToken);
    const entries = await ctx.db.query("scoreEvents").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect();
    const latest = entries.sort((a, b) => b.createdAt - a.createdAt)[0];
    if (latest) await ctx.db.delete(latest._id);
  },
});
