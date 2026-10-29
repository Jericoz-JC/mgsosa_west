import { isConferenceSlug, isTopic } from "./conferences";
import type { AdminSaveInput, AskInput, ClergyRole } from "./types";

/**
 * Shared by the ask form and the Convex mutations so the browser and the
 * server reject the same input with the same message.
 */
export const QA_LIMITS = {
  questionMin: 10,
  questionMax: 600,
  answerMin: 10,
  answerMax: 4000,
  nameMax: 32,
  churchMax: 64,
  clergyNameMax: 60,
  sessionMax: 80,
} as const;

const CLERGY_ROLES: ClergyRole[] = ["priest", "bishop", "guest-speaker"];

export function cleanText(value: string | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/** Keeps paragraph breaks in long-form answers while trimming stray whitespace. */
export function cleanParagraphs(value: string | undefined) {
  return (value ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").trim())
    .filter(Boolean)
    .join("\n\n");
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateAsk(input: AskInput): ValidationResult<AskInput> {
  const body = cleanText(input.body);
  const askerName = cleanText(input.askerName) || undefined;
  const askerChurch = cleanText(input.askerChurch) || undefined;
  if (body.length < QA_LIMITS.questionMin) return { ok: false, error: "Write your question in at least a full sentence." };
  if (body.length > QA_LIMITS.questionMax) return { ok: false, error: `Keep questions under ${QA_LIMITS.questionMax} characters.` };
  if (!isConferenceSlug(input.conference)) return { ok: false, error: "Choose where this question came up." };
  if (!isTopic(input.topic)) return { ok: false, error: "Choose a topic for your question." };
  if (askerName && askerName.length > QA_LIMITS.nameMax) return { ok: false, error: "Use a shorter first name." };
  if (askerChurch && askerChurch.length > QA_LIMITS.churchMax) return { ok: false, error: "Use a shorter church name." };
  if (/https?:\/\/|www\./i.test(body)) return { ok: false, error: "Links aren’t allowed in questions." };
  return { ok: true, value: { body, conference: input.conference, topic: input.topic, askerName, askerChurch } };
}

export function validateAdminSave(input: AdminSaveInput): ValidationResult<AdminSaveInput> {
  const body = cleanText(input.body);
  if (body.length < QA_LIMITS.questionMin || body.length > QA_LIMITS.questionMax) {
    return { ok: false, error: `Questions must be ${QA_LIMITS.questionMin}–${QA_LIMITS.questionMax} characters.` };
  }
  if (!isConferenceSlug(input.conference)) return { ok: false, error: "Choose a conference or General." };
  if (!isTopic(input.topic)) return { ok: false, error: "Choose a topic." };
  if (!["submitted", "open", "answered", "hidden"].includes(input.status)) return { ok: false, error: "Choose a status." };

  if (input.status === "answered" && !input.answer) {
    return { ok: false, error: "Add the clergy-verified answer before publishing it as answered." };
  }
  if (!input.answer) return { ok: true, value: { ...input, body, answer: undefined } };

  const answerBody = cleanParagraphs(input.answer.body);
  const name = cleanText(input.answer.name) || undefined;
  const session = cleanText(input.answer.session) || undefined;
  if (answerBody.length < QA_LIMITS.answerMin || answerBody.length > QA_LIMITS.answerMax) {
    return { ok: false, error: `Answers must be ${QA_LIMITS.answerMin}–${QA_LIMITS.answerMax} characters.` };
  }
  if (!CLERGY_ROLES.includes(input.answer.role)) return { ok: false, error: "Choose who verified the answer." };
  if (input.answer.showName && !name) return { ok: false, error: "Enter the clergy name, or choose to show only their role." };
  if (name && name.length > QA_LIMITS.clergyNameMax) return { ok: false, error: "Use a shorter clergy name." };
  if (session && session.length > QA_LIMITS.sessionMax) return { ok: false, error: "Use a shorter session label." };
  return {
    ok: true,
    value: {
      ...input,
      body,
      answer: { body: answerBody, role: input.answer.role, name, showName: input.answer.showName, session },
    },
  };
}
