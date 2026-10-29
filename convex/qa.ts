import { ConvexError, v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { validateAdminSave, validateAsk } from "../lib/qa/validation";
import { assertAdminPin, isAdminPin, sha256Hex } from "./security";

// Community questions wait in a private queue until an admin approves them,
// so nothing a visitor types appears publicly without review.
const MAX_PENDING_PER_ASKER = 5;
const MAX_PENDING_TOTAL = 500;
const ASKER_WINDOW_MS = 60 * 60 * 1000;

const statusValidator = v.union(v.literal("submitted"), v.literal("open"), v.literal("answered"), v.literal("hidden"));
const roleValidator = v.union(v.literal("priest"), v.literal("bishop"), v.literal("guest-speaker"));

function assertToken(token: string) {
  if (!/^[A-Za-z0-9_-]{24,128}$/.test(token)) throw new ConvexError("Refresh the page and try again.");
}

function toPublic(question: Doc<"qaQuestions">) {
  return {
    id: question._id,
    body: question.body,
    conference: question.conference,
    topic: question.topic,
    status: question.status,
    source: question.source,
    askerName: question.askerName,
    askerChurch: question.askerChurch,
    // Draft answers stay private until the question is published as answered.
    answer: question.status === "answered" ? question.answer : undefined,
    votes: question.votes,
    createdAt: question.createdAt,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const [open, answered] = await Promise.all([
      ctx.db.query("qaQuestions").withIndex("by_status", (q) => q.eq("status", "open")).collect(),
      ctx.db.query("qaQuestions").withIndex("by_status", (q) => q.eq("status", "answered")).collect(),
    ]);
    return [...answered, ...open].map(toPublic);
  },
});

export const myVotes = query({
  args: { voterToken: v.string() },
  handler: async (ctx, args) => {
    if (!/^[A-Za-z0-9_-]{24,128}$/.test(args.voterToken)) return [];
    const voterHash = await sha256Hex(args.voterToken);
    const votes = await ctx.db.query("qaVotes").withIndex("by_voter", (q) => q.eq("voterHash", voterHash)).collect();
    return votes.map((vote) => vote.questionId);
  },
});

export const ask = mutation({
  args: {
    body: v.string(),
    conference: v.string(),
    topic: v.string(),
    askerName: v.optional(v.string()),
    askerChurch: v.optional(v.string()),
    askerToken: v.string(),
  },
  handler: async (ctx, args) => {
    assertToken(args.askerToken);
    const result = validateAsk(args);
    if (!result.ok) throw new ConvexError(result.error);
    const askerTokenHash = await sha256Hex(args.askerToken);
    const now = Date.now();
    const recent = (await ctx.db.query("qaQuestions").withIndex("by_asker", (q) => q.eq("askerTokenHash", askerTokenHash)).collect())
      .filter((question) => question.status === "submitted" && now - question.createdAt < ASKER_WINDOW_MS);
    if (recent.length >= MAX_PENDING_PER_ASKER) {
      throw new ConvexError("Thanks for all your questions! Please wait for the admins to review them before sending more.");
    }
    const pending = await ctx.db.query("qaQuestions").withIndex("by_status", (q) => q.eq("status", "submitted")).take(MAX_PENDING_TOTAL);
    if (pending.length >= MAX_PENDING_TOTAL) throw new ConvexError("The question queue is full right now. Try again later.");
    await ctx.db.insert("qaQuestions", {
      ...result.value,
      status: "submitted",
      source: "community",
      askerTokenHash,
      votes: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const toggleVote = mutation({
  args: { questionId: v.id("qaQuestions"), voterToken: v.string() },
  handler: async (ctx, args) => {
    assertToken(args.voterToken);
    const question = await ctx.db.get(args.questionId);
    if (!question || (question.status !== "open" && question.status !== "answered")) {
      throw new ConvexError("This question is no longer available.");
    }
    const voterHash = await sha256Hex(args.voterToken);
    const existing = await ctx.db
      .query("qaVotes")
      .withIndex("by_question_voter", (q) => q.eq("questionId", args.questionId).eq("voterHash", voterHash))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(question._id, { votes: Math.max(0, question.votes - 1) });
      return { voted: false };
    }
    await ctx.db.insert("qaVotes", { questionId: args.questionId, voterHash });
    await ctx.db.patch(question._id, { votes: question.votes + 1 });
    return { voted: true };
  },
});

export const verifyAdminPin = query({
  args: { adminPin: v.string() },
  handler: async (_ctx, args) => isAdminPin(args.adminPin),
});

export const adminList = query({
  args: { adminPin: v.string() },
  handler: async (ctx, args) => {
    assertAdminPin(args.adminPin);
    const questions = await ctx.db.query("qaQuestions").order("desc").take(1000);
    return questions.map((question) => ({ ...toPublic(question), answer: question.answer }));
  },
});

export const adminSave = mutation({
  args: {
    adminPin: v.string(),
    id: v.optional(v.id("qaQuestions")),
    body: v.string(),
    conference: v.string(),
    topic: v.string(),
    status: statusValidator,
    answer: v.optional(v.object({
      body: v.string(),
      role: roleValidator,
      name: v.optional(v.string()),
      showName: v.boolean(),
      session: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    assertAdminPin(args.adminPin);
    const result = validateAdminSave(args);
    if (!result.ok) throw new ConvexError(result.error);
    const { body, conference, topic, status } = result.value;
    const now = Date.now();
    const existing = args.id ? await ctx.db.get(args.id) : null;
    if (args.id && !existing) throw new ConvexError("That question no longer exists.");
    const previousAnswer = existing?.answer;
    const answer = result.value.answer
      ? {
          ...result.value.answer,
          // Keep the original answer date when only the wording is edited.
          answeredAt: previousAnswer && previousAnswer.body === result.value.answer.body ? previousAnswer.answeredAt : now,
        }
      : undefined;
    if (existing) {
      await ctx.db.patch(existing._id, { body, conference, topic, status, answer, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("qaQuestions", {
      body, conference, topic, status, answer,
      source: "admin",
      votes: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const adminSetStatus = mutation({
  args: { adminPin: v.string(), id: v.id("qaQuestions"), status: statusValidator },
  handler: async (ctx, args) => {
    assertAdminPin(args.adminPin);
    const question = await ctx.db.get(args.id);
    if (!question) throw new ConvexError("That question no longer exists.");
    if (args.status === "answered" && !question.answer) {
      throw new ConvexError("Add the clergy-verified answer before publishing it as answered.");
    }
    await ctx.db.patch(question._id, { status: args.status, updatedAt: Date.now() });
  },
});

export const adminDelete = mutation({
  args: { adminPin: v.string(), id: v.id("qaQuestions") },
  handler: async (ctx, args) => {
    assertAdminPin(args.adminPin);
    if (!(await ctx.db.get(args.id))) return;
    const votes = await ctx.db.query("qaVotes").withIndex("by_question", (q) => q.eq("questionId", args.id)).collect();
    for (const vote of votes) await ctx.db.delete(vote._id);
    await ctx.db.delete(args.id);
  },
});
