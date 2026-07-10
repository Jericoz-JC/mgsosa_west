import { describe, expect, it } from "vitest";
import { generateRoomCode, generateUniqueRoomCode } from "./room-codes";

describe("breakout room codes", () => {
  it("creates numeric codes between four and six digits", () => {
    expect(generateRoomCode(4, () => 0)).toBe("1000");
    expect(generateRoomCode(6, () => 2)).toBe("322222");
  });

  it("rejects lengths outside the temporary-room range", () => {
    expect(() => generateRoomCode(3)).toThrow(/4 to 6/);
    expect(() => generateRoomCode(7)).toThrow(/4 to 6/);
  });

  it("avoids active room codes", () => {
    let call = 0;
    const sequence = [0, 0, 0, 0, 0, 1, 2, 3, 4, 5];
    const code = generateUniqueRoomCode(["10000"], 5, () => sequence[call++] ?? 6);
    expect(code).toBe("22345");
  });
});
