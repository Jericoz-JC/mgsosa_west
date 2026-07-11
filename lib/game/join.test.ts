import { describe, expect, it } from "vitest";
import { matchesEventCode, safeJoin } from "./join";
import { WEST_REGION_CHURCHES } from "./churches";
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

  it("accepts every West region church and a typed visiting church", () => {
    for (const church of WEST_REGION_CHURCHES) {
      expect(safeJoin({ eventCode: "WEST26", name: "Guest", church }).success).toBe(true);
    }
    const visiting = safeJoin({ eventCode: "WEST26", name: "Guest", church: "  St. Thomas Church, Portland  " });
    expect(visiting.success).toBe(true);
    if (visiting.success) expect(visiting.data.church).toBe("St. Thomas Church, Portland");
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
