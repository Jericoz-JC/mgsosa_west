import { describe, expect, it } from "vitest";
import { gameEvents } from "../game/event-config";
import { getEvent, siteEvents, splitEvents } from "./events";

describe("site events", () => {
  it("keeps a multi-day event upcoming until its last day", () => {
    const { upcoming } = splitEvents(siteEvents, "2026-10-11");
    expect(upcoming.map((event) => event.slug)).toContain("sofc-2026");
    expect(splitEvents(siteEvents, "2026-10-12").past.map((event) => event.slug)).toContain("sofc-2026");
  });

  it("always lists recurring events as upcoming", () => {
    expect(splitEvents(siteEvents, "2030-01-01").upcoming.map((event) => event.slug)).toEqual(["monthly-bible-study"]);
  });

  it("links every game-night page to a configured Game Mode event", () => {
    for (const event of siteEvents.filter((candidate) => candidate.gameEventCode)) {
      const config = gameEvents[event.gameEventCode!];
      expect(config, event.slug).toBeDefined();
      expect(getEvent(config.eventSlug)).toBe(event);
    }
  });
});
