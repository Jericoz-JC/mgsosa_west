import { describe, expect, it } from "vitest";
import { sessionBelongsToEvent, sessionTokenStorageKey } from "./session";

describe("event-scoped participant sessions", () => {
  it("uses a different browser-storage key for each event", () => {
    expect(sessionTokenStorageKey(" west26 ")).toBe(
      "mgsosa-west-session-token:WEST26",
    );
    expect(sessionTokenStorageKey("WEST27")).not.toBe(
      sessionTokenStorageKey("WEST26"),
    );
  });

  it("accepts an identity only for the active event", () => {
    expect(sessionBelongsToEvent("event-west-26", "event-west-26")).toBe(true);
    expect(sessionBelongsToEvent("event-west-25", "event-west-26")).toBe(false);
  });

  it("does not accept an identity before both event IDs are known", () => {
    expect(sessionBelongsToEvent(undefined, "event-west-26")).toBe(false);
    expect(sessionBelongsToEvent("event-west-26", undefined)).toBe(false);
  });
});
