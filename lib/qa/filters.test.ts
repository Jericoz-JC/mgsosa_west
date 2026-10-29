import { describe, expect, it } from "vitest";
import { attributionLabel, conferenceCounts, defaultFilters, filterQuestions } from "./filters";
import { createSampleQuestions } from "./sample";

const questions = createSampleQuestions(1_800_000_000_000);

describe("Ask the Clergy filters", () => {
  it("shows only published answers in the answered view", () => {
    const result = filterQuestions(questions, defaultFilters);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((question) => question.status === "answered")).toBe(true);
  });

  it("separates one conference, all conferences, and everything", () => {
    const sofc = filterQuestions(questions, { ...defaultFilters, conference: "sofc-2026" });
    const anyConference = filterQuestions(questions, { ...defaultFilters, conference: "conferences" });
    const everything = filterQuestions(questions, { ...defaultFilters, conference: "all" });
    expect(sofc.every((question) => question.conference === "sofc-2026")).toBe(true);
    expect(anyConference.every((question) => question.conference !== "general")).toBe(true);
    expect(everything.length).toBeGreaterThan(anyConference.length);
  });

  it("filters by the clergy role that verified the answer", () => {
    const bishops = filterQuestions(questions, { ...defaultFilters, clergy: "bishop" });
    expect(bishops.map((question) => question.answer?.role)).toEqual(["bishop"]);
  });

  it("searches question and answer text, ignoring case", () => {
    const result = filterQuestions(questions, { ...defaultFilters, search: "NATIVITY" });
    expect(result.map((question) => question.id)).toEqual(["sample-kaukbo"]);
  });

  it("sorts by how many people asked, then by recency", () => {
    const result = filterQuestions(questions, { ...defaultFilters, view: "open" });
    expect(result.map((question) => question.votes)).toEqual([...result.map((question) => question.votes)].sort((a, b) => b - a));
    const newest = filterQuestions(questions, { ...defaultFilters, view: "open", sort: "newest" });
    expect(newest[0].id).toBe("sample-confession");
  });

  it("counts chips for the current view only", () => {
    const counts = conferenceCounts(questions, "open");
    expect(counts.all).toBe(3);
    expect(counts.conferences + counts.general).toBe(counts.all);
  });
});

describe("answer attribution", () => {
  it("shows the clergy name only when chosen", () => {
    expect(attributionLabel({ role: "priest", name: "Fr. Example", showName: true })).toEqual({ verifiedBy: "Fr. Example", detail: "Priest" });
    expect(attributionLabel({ role: "priest", name: "Fr. Example", showName: false }).verifiedBy).toBe("Verified by a priest");
  });

  it("falls back to the role when a name is missing", () => {
    expect(attributionLabel({ role: "bishop", showName: true }).verifiedBy).toBe("Verified by a bishop");
    expect(attributionLabel({ role: "guest-speaker", showName: false }).verifiedBy).toBe("Verified by a guest speaker");
  });
});
