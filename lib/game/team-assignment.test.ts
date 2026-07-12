import { describe, expect, it } from "vitest";
import { balanceParticipants, recommendedGroupCount } from "./team-assignment";

const people = Array.from({ length: 23 }, (_, index) => ({
  id: String(index),
  name: `Player ${index}`,
  church: index < 10 ? "St. Mary" : index < 17 ? "St. George" : "St. Thomas",
}));

describe("team assignment", () => {
  it("adds the smallest number of groups needed to stay near the target", () => {
    expect(recommendedGroupCount(23, 2, 10)).toBe(3);
    expect(recommendedGroupCount(23, 4, 10)).toBe(4);
    expect(recommendedGroupCount(100, 2, 10)).toBe(8);
  });

  it("keeps group sizes within one participant", () => {
    const groups = balanceParticipants(people, 4);
    expect(groups.map((group) => group.length)).toEqual([6, 6, 6, 5]);
  });

  it("is deterministic and distributes the largest church cohort", () => {
    const first = balanceParticipants(people, 4);
    const second = balanceParticipants([...people].reverse(), 4);
    expect(second).toEqual(first);
    expect(first.map((group) => group.filter((person) => person.church === "St. Mary").length)).toEqual([3, 3, 2, 2]);
  });
});
