import { describe, expect, it } from "vitest";
import { cleanParagraphs, validateAdminSave, validateAsk } from "./validation";

const ask = { body: "Why do we face east when we pray?", conference: "general", topic: "Prayer + Fasting" };

describe("validateAsk", () => {
  it("accepts a clean question and trims whitespace", () => {
    const result = validateAsk({ ...ask, body: "  Why do we   face east when we pray?  ", askerName: "  " });
    expect(result).toEqual({ ok: true, value: { ...ask, askerName: undefined, askerChurch: undefined } });
  });

  it("rejects short questions, links, unknown conferences, and missing topics", () => {
    expect(validateAsk({ ...ask, body: "Why?" }).ok).toBe(false);
    expect(validateAsk({ ...ask, body: "Please read https://example.com and answer" }).ok).toBe(false);
    expect(validateAsk({ ...ask, conference: "nalc-1999" }).ok).toBe(false);
    expect(validateAsk({ ...ask, topic: "" }).ok).toBe(false);
  });
});

describe("validateAdminSave", () => {
  const answer = { body: "Because Christ, the Sun of Righteousness, is awaited from the east.", role: "priest" as const, showName: false };

  it("requires an answer before publishing as answered", () => {
    expect(validateAdminSave({ ...ask, status: "answered" })).toEqual({ ok: false, error: expect.stringContaining("clergy-verified") });
    expect(validateAdminSave({ ...ask, status: "answered", answer }).ok).toBe(true);
  });

  it("requires a name when the clergy name is shown", () => {
    expect(validateAdminSave({ ...ask, status: "answered", answer: { ...answer, showName: true, name: " " } }).ok).toBe(false);
    expect(validateAdminSave({ ...ask, status: "answered", answer: { ...answer, showName: true, name: "Fr. Example" } }).ok).toBe(true);
  });

  it("allows saving an approved question without an answer", () => {
    expect(validateAdminSave({ ...ask, status: "open" }).ok).toBe(true);
  });
});

describe("cleanParagraphs", () => {
  it("keeps paragraph breaks and trims each paragraph", () => {
    expect(cleanParagraphs("  First   line.\n\n\n  Second  ")).toBe("First line.\n\nSecond");
  });
});
