import { describe, expect, it } from "vitest";
import { buildRoomHostLink, generateRoomHostToken, isRoomHostToken, roomHostTokenFromHash } from "./room-host";

describe("private room-host links", () => {
  it("creates a 192-bit hex bearer token", () => {
    const token = generateRoomHostToken((values) => {
      values.fill(0xab);
      return values;
    });

    expect(token).toBe("ab".repeat(24));
    expect(isRoomHostToken(token)).toBe(true);
  });

  it("puts the token in the URL fragment rather than the request path", () => {
    const token = "12".repeat(24);
    const link = buildRoomHostLink("https://games.example.org", token, "walkthrough");

    expect(link).toBe(`https://games.example.org/room?v=walkthrough#host=${token}`);
    expect(new URL(link).pathname).toBe("/room");
    expect(new URL(link).searchParams.get("v")).toBe("walkthrough");
    expect(new URL(link).search).not.toContain(token);
    expect(roomHostTokenFromHash(new URL(link).hash)).toBe(token);
  });

  it("rejects malformed fragments", () => {
    expect(roomHostTokenFromHash("#host=48215")).toBeNull();
    expect(() => buildRoomHostLink("https://games.example.org", "48215")).toThrow(/Invalid/);
  });
});
