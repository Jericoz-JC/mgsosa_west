import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  events: defineTable({
    code: v.string(),
    title: v.string(),
    phase: v.string(),
    phaseStartedAt: v.number(),
    activeRoomMessage: v.string(),
    subtractIncorrect: v.boolean(),
    answerSeconds: v.number(),
  }).index("by_code", ["code"]),

  teams: defineTable({
    eventId: v.id("events"),
    slug: v.string(),
    name: v.string(),
    shortName: v.string(),
    color: v.string(),
    accent: v.string(),
  }).index("by_event", ["eventId"]),

  players: defineTable({
    eventId: v.id("events"),
    sessionToken: v.string(),
    name: v.string(),
    church: v.string(),
    teamId: v.id("teams"),
    role: v.union(v.literal("participant"), v.literal("room-admin"), v.literal("game-master")),
    rotationGroup: v.string(),
    lastSeenAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_session_token", ["sessionToken"]),

  breakoutRooms: defineTable({
    eventId: v.id("events"),
    name: v.string(),
    // A breakout game id from lib/games/registry.ts, validated in mutations.
    game: v.string(),
    code: v.string(),
    hostName: v.string(),
    status: v.union(v.literal("draft"), v.literal("open"), v.literal("in-progress"), v.literal("closed")),
    rotationGroups: v.array(v.string()),
    capacity: v.optional(v.number()),
    externalUrl: v.optional(v.string()),
  })
    .index("by_event", ["eventId"])
    .index("by_code", ["code"])
    .index("by_event_code", ["eventId", "code"]),

  roomMembers: defineTable({
    roomId: v.id("breakoutRooms"),
    playerId: v.id("players"),
    joinedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_player", ["playerId"])
    .index("by_player_room", ["playerId", "roomId"]),

  roomHostGrants: defineTable({
    eventId: v.id("events"),
    roomId: v.id("breakoutRooms"),
    tokenHash: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_room", ["roomId"]),

  questions: defineTable({
    eventId: v.id("events"),
    sourceId: v.string(),
    category: v.string(),
    value: v.number(),
    clue: v.string(),
    answer: v.string(),
    ageBand: v.string(),
    round: v.optional(v.number()),
    used: v.boolean(),
  })
    .index("by_event", ["eventId"])
    .index("by_event_category", ["eventId", "category"]),

  jeopardyGames: defineTable({
    eventId: v.id("events"),
    currentQuestionId: v.optional(v.id("questions")),
    currentBuzzWindowId: v.optional(v.id("buzzWindows")),
    activeRound: v.optional(v.number()),
  }).index("by_event", ["eventId"]),

  buzzWindows: defineTable({
    eventId: v.id("events"),
    questionId: v.id("questions"),
    status: v.union(v.literal("locked"), v.literal("open"), v.literal("claimed")),
    attempt: v.number(),
    openedAt: v.optional(v.number()),
    claimedAt: v.optional(v.number()),
    winnerPlayerId: v.optional(v.id("players")),
    lockedTeamIds: v.array(v.id("teams")),
  }).index("by_event", ["eventId"]),

  scoreEvents: defineTable({
    eventId: v.id("events"),
    teamId: v.id("teams"),
    delta: v.number(),
    reason: v.string(),
    idempotencyKey: v.optional(v.string()),
    questionId: v.optional(v.id("questions")),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_event_team", ["eventId", "teamId"])
    .index("by_event_idempotency", ["eventId", "idempotencyKey"]),

  imposterRounds: defineTable({
    roomId: v.id("breakoutRooms"),
    normalWord: v.string(),
    imposterWord: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("clues"), v.literal("discussion"), v.literal("voting"), v.literal("revealed")),
    roundNumber: v.number(),
    startedAt: v.number(),
  }).index("by_room", ["roomId"]),

  secretAssignments: defineTable({
    roundId: v.id("imposterRounds"),
    playerId: v.id("players"),
    word: v.optional(v.string()),
    isImposter: v.boolean(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_player", ["roundId", "playerId"]),

  votes: defineTable({
    roundId: v.id("imposterRounds"),
    voterPlayerId: v.id("players"),
    accusedPlayerId: v.id("players"),
    createdAt: v.number(),
  })
    .index("by_round", ["roundId"])
    .index("by_round_voter", ["roundId", "voterPlayerId"]),

  qaQuestions: defineTable({
    body: v.string(),
    conference: v.string(),
    topic: v.string(),
    status: v.union(v.literal("submitted"), v.literal("open"), v.literal("answered"), v.literal("hidden")),
    source: v.union(v.literal("community"), v.literal("admin")),
    askerName: v.optional(v.string()),
    askerChurch: v.optional(v.string()),
    askerTokenHash: v.optional(v.string()),
    answer: v.optional(v.object({
      body: v.string(),
      role: v.union(v.literal("priest"), v.literal("bishop"), v.literal("guest-speaker")),
      name: v.optional(v.string()),
      showName: v.boolean(),
      session: v.optional(v.string()),
      answeredAt: v.number(),
    })),
    votes: v.number(),
    // Where a hidden question returns on Restore, so hiding never skips review.
    restoreTo: v.optional(v.union(v.literal("submitted"), v.literal("open"), v.literal("answered"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_asker", ["askerTokenHash"]),

  qaVotes: defineTable({
    questionId: v.id("qaQuestions"),
    voterHash: v.string(),
  })
    .index("by_question_voter", ["questionId", "voterHash"])
    .index("by_voter", ["voterHash"])
    .index("by_question", ["questionId"]),

  staffSessions: defineTable({
    role: v.union(v.literal("game-master"), v.literal("qa-admin")),
    tokenHash: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_token_hash", ["tokenHash"])
    .index("by_role", ["role"]),

  staffSignInAttempts: defineTable({
    role: v.union(v.literal("game-master"), v.literal("qa-admin")),
    failedAt: v.number(),
  }).index("by_role", ["role"]),

  // Singleton (key "main"). Game Mode is live only while activeEventCode is set.
  siteSettings: defineTable({
    key: v.string(),
    activeEventCode: v.optional(v.string()),
  }).index("by_key", ["key"]),
});
