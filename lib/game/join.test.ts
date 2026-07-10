import { describe, expect, it } from "vitest";
import { matchesEventCode, safeJoin } from "./join";
import { getRoleHome } from "./routes";

describe("join and role routing", () => {
  it("normalizes event codes and trims participant details", () => {
    const parsed = safeJoin({ eventCode: " west26 ", name: " Maya ", church: " St. Mary's " });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.eventCode).toBe("WEST26");
      expect(parsed.data.name).toBe("Maya");
    }
  });

  it("rejects incomplete participant details", () => {
    expect(safeJoin({ eventCode: "", name: "", church: "" }).success).toBe(false);
  });

  it("matches only the event hosted by this deployment", () => {
    expect(matchesEventCode(" west26 ", "WEST26")).toBe(true);
    expect(matchesEventCode("WEST27", "WEST26")).toBe(false);
  });

  it("gives every role a distinct, predictable home", () => {
    expect(getRoleHome("participant")).toBe("/play");
    expect(getRoleHome("room-admin")).toBe("/room");
    expect(getRoleHome("game-master")).toBe("/host");
    expect(getRoleHome("display")).toBe("/display");
  });
});
