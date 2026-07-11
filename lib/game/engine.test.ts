import { describe, expect, it } from "vitest";
import { claimBuzz, gameReducer, getTeamScore } from "./engine";
import { createSeedState } from "./seed";

function openFirstQuestion() {
  const selected = gameReducer(createSeedState(1000), {
    type: "select-question",
    questionId: "q-1-1",
    at: 1100,
  });
  return gameReducer(selected, { type: "open-buzzers", at: 1200 });
}

describe("Jeopardy game engine", () => {
  it("accepts exactly the first buzz", () => {
    const open = openFirstQuestion();
    const first = claimBuzz(open, "player-maya", 1250);
    const second = claimBuzz(first.state, "player-noah", 1251);

    expect(first.accepted).toBe(true);
    expect(first.state.buzzWindow?.winnerPlayerId).toBe("player-maya");
    expect(second.accepted).toBe(false);
    expect(second.reason).toBe("already-claimed");
  });

  it("does not erase a winning buzz when open is submitted twice", () => {
    const open = openFirstQuestion();
    const claimed = gameReducer(open, { type: "buzz", playerId: "player-maya", at: 1250 });
    const duplicateOpen = gameReducer(claimed, { type: "open-buzzers", at: 1251 });

    expect(duplicateOpen.buzzWindow?.status).toBe("claimed");
    expect(duplicateOpen.buzzWindow?.winnerPlayerId).toBe("player-maya");
  });

  it("awards the question value and closes the question", () => {
    const open = openFirstQuestion();
    const buzzed = gameReducer(open, { type: "buzz", playerId: "player-maya", at: 1250 });
    const scored = gameReducer(buzzed, { type: "mark-correct", at: 1300 });

    expect(getTeamScore(scored, "pacific")).toBe(400);
    expect(scored.questions.find((question) => question.id === "q-1-1")?.used).toBe(true);
    expect(scored.buzzWindow?.status).toBe("locked");
  });

  it("locks an incorrect team out before reopening", () => {
    const open = openFirstQuestion();
    const buzzed = gameReducer(open, { type: "buzz", playerId: "player-maya", at: 1250 });
    const incorrect = gameReducer(buzzed, { type: "mark-incorrect", at: 1300 });
    const reopened = gameReducer(incorrect, { type: "open-buzzers", at: 1400 });

    expect(reopened.buzzWindow?.lockedTeamIds).toContain("pacific");
    expect(claimBuzz(reopened, "player-maya", 1450).reason).toBe("team-locked");
    expect(claimBuzz(reopened, "player-noah", 1451).accepted).toBe(true);
  });

  it("supports manual score adjustments and undo", () => {
    const state = createSeedState(1000);
    const adjusted = gameReducer(state, {
      type: "adjust-score",
      teamId: "valley",
      delta: 100,
      reason: "Favorite Gartic album",
      at: 1500,
    });
    expect(getTeamScore(adjusted, "valley")).toBe(250);
    expect(getTeamScore(gameReducer(adjusted, { type: "undo-score" }), "valley")).toBe(150);
  });

  it("records a room result only once for an idempotency key", () => {
    const action = {
      type: "adjust-score" as const,
      teamId: "pacific" as const,
      delta: 200,
      reason: "Imposter room winner",
      at: 1500,
      idempotencyKey: "room-award:room-a:rotation-one",
    };
    const once = gameReducer(createSeedState(1000), action);
    const twice = gameReducer(once, { ...action, at: 1600 });

    expect(getTeamScore(once, "pacific")).toBe(500);
    expect(getTeamScore(twice, "pacific")).toBe(500);
  });

  it("updates a temporary room code in shared demo state", () => {
    const state = createSeedState(1000);
    const updated = gameReducer(state, {
      type: "set-room-code",
      roomId: "room-gartic-a",
      code: "86420",
    });

    expect(updated.breakoutRooms.find((room) => room.id === "room-gartic-a")?.code).toBe("86420");
  });

  it("switches Jeopardy rounds without changing scores", () => {
    const state = createSeedState(1000);
    const switched = gameReducer(state, { type: "set-jeopardy-round", round: 2 });

    expect(switched.jeopardyRound).toBe(2);
    expect(switched.currentQuestionId).toBeUndefined();
    expect(switched.scoreLedger).toEqual(state.scoreLedger);
    expect(switched.questions.filter((question) => question.round === 2)).toHaveLength(30);
  });
});
