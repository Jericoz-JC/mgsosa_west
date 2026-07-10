import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { assertHostPin } from "./security";

export const adjust = mutation({
  args: { eventId: v.id("events"), teamId: v.id("teams"), delta: v.number(), reason: v.string(), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    await ctx.db.insert("scoreEvents", {
      eventId: args.eventId,
      teamId: args.teamId,
      delta: args.delta,
      reason: args.reason.trim().slice(0, 160),
      createdAt: Date.now(),
    });
  },
});

export const undoLast = mutation({
  args: { eventId: v.id("events"), hostPin: v.string() },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    const entries = await ctx.db.query("scoreEvents").withIndex("by_event", (q) => q.eq("eventId", args.eventId)).collect();
    const latest = entries.sort((a, b) => b.createdAt - a.createdAt)[0];
    if (latest) await ctx.db.delete(latest._id);
  },
});
