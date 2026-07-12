import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { assertHostPin } from "./security";
import { balanceParticipants, recommendedGroupCount } from "../lib/game/team-assignment";

const TEAM_PALETTE = [
  { slug: "pacific", name: "Pacific Blue", shortName: "Pacific", color: "#1d75bd", accent: "#8dd4ff" },
  { slug: "sierra", name: "Sierra Gold", shortName: "Sierra", color: "#d69b2d", accent: "#ffe19a" },
  { slug: "desert", name: "Desert Coral", shortName: "Desert", color: "#d45e50", accent: "#ffc1b8" },
  { slug: "valley", name: "Valley Green", shortName: "Valley", color: "#39816b", accent: "#a7e1ce" },
  { slug: "redwood", name: "Redwood Red", shortName: "Redwood", color: "#a63f3f", accent: "#f0aaaa" },
  { slug: "mission", name: "Mission Violet", shortName: "Mission", color: "#7155a6", accent: "#cdbcf0" },
  { slug: "coast", name: "Coast Teal", shortName: "Coast", color: "#167a82", accent: "#9de2e6" },
  { slug: "sunset", name: "Sunset Orange", shortName: "Sunset", color: "#c6692d", accent: "#f7c097" },
] as const;

export const assignBalanced = mutation({
  args: {
    eventId: v.id("events"),
    hostPin: v.string(),
    minimumGroups: v.number(),
    targetSize: v.number(),
  },
  handler: async (ctx, args) => {
    assertHostPin(args.hostPin);
    if (!Number.isInteger(args.minimumGroups) || args.minimumGroups < 2 || args.minimumGroups > 8) {
      throw new ConvexError("Choose between 2 and 8 groups.");
    }
    if (!Number.isInteger(args.targetSize) || args.targetSize < 4 || args.targetSize > 16) {
      throw new ConvexError("Target size must be between 4 and 16 people.");
    }
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new ConvexError("Event not found.");
    const participants = (await ctx.db.query("players").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect())
      .filter((player) => player.role === "participant");
    if (participants.length < 2) throw new ConvexError("At least two participants must check in first.");

    const groupCount = recommendedGroupCount(participants.length, args.minimumGroups, args.targetSize);
    const existing = await ctx.db.query("teams").withIndex("by_event", (q) => q.eq("eventId", event._id)).collect();
    const bySlug = new Map(existing.map((team) => [team.slug, team]));
    const activeTeams = [];
    for (let index = 0; index < TEAM_PALETTE.length; index += 1) {
      const template = TEAM_PALETTE[index];
      const found = bySlug.get(template.slug);
      const active = index < groupCount;
      if (found) {
        await ctx.db.patch(found._id, { ...template, active, position: index });
        if (active) activeTeams.push({ ...found, ...template });
      } else {
        const id = await ctx.db.insert("teams", { eventId: event._id, ...template, active, position: index });
        if (active) activeTeams.push({ _id: id, eventId: event._id, _creationTime: Date.now(), ...template });
      }
    }

    // Place the largest church cohorts first. Each participant goes to the
    // smallest group; ties prefer the group with fewer people from that church.
    // This is deterministic O(participants × groups), with at most eight groups.
    const balanced = balanceParticipants(participants.map((player) => ({ ...player, id: String(player._id) })), groupCount);
    const assignments = activeTeams.map((team, index) => ({ team, members: balanced[index] ?? [] }));
    for (const assignment of assignments) {
      for (const player of assignment.members) await ctx.db.patch(player._id, { teamId: assignment.team._id });
    }
    return {
      participantCount: participants.length,
      requestedGroupCount: args.minimumGroups,
      targetSize: args.targetSize,
      groupCount,
      sizes: assignments.map((assignment) => assignment.members.length),
    };
  },
});
