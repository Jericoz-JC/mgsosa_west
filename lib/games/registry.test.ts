import { describe, expect, it } from "vitest";
import { gameEvents } from "../game/event-config";
import { breakoutGames, games, getGame, isBreakoutGameId } from "./registry";

describe("game registry", () => {
  it("has unique ids", () => {
    expect(new Set(games.map((game) => game.id)).size).toBe(games.length);
  });

  it("gives every breakout game a host run-of-round and participant steps", () => {
    for (const game of breakoutGames) {
      expect(game.hostStages?.length, game.id).toBeGreaterThanOrEqual(2);
      expect(game.participantSteps?.length, game.id).toBeGreaterThan(0);
      expect(new Set(game.hostStages!.map((stage) => stage.id)).size, game.id).toBe(game.hostStages!.length);
    }
  });

  it("only lets breakout games become rooms", () => {
    expect(isBreakoutGameId("who-am-i")).toBe(true);
    expect(isBreakoutGameId("bible-jeopardy")).toBe(false);
    expect(isBreakoutGameId("unknown")).toBe(false);
  });
});

describe("game event configs", () => {
  it.each(Object.values(gameEvents))("$code seeds valid, unique breakout rooms", (event) => {
    expect(event.code).toBe(event.code.toUpperCase());
    expect(event.runOfShow[0].phase).toBe("lobby");
    for (const room of event.rooms) {
      expect(getGame(room.game)?.format, room.name).toBe("breakout");
      expect(room.code).toMatch(/^\d{4,6}$/);
    }
    expect(new Set(event.rooms.map((room) => room.code)).size).toBe(event.rooms.length);
    expect(new Set(event.rooms.map((room) => room.name)).size).toBe(event.rooms.length);
  });
});
