"use client";

import { createContext, useContext } from "react";
import type { AdminSaveInput, AskInput, QAQuestion, QuestionStatus } from "@/lib/qa/types";

export interface QAContextValue {
  mode: "demo" | "convex";
  /** Published questions (open + answered). undefined while loading. */
  questions: QAQuestion[] | undefined;
  myVotes: ReadonlySet<string>;
  ask: (input: AskInput) => Promise<void>;
  toggleVote: (questionId: string) => Promise<void>;
  /** Moderator PIN entered on this device. Demo mode is always authorized. */
  adminPin: string | null;
  submitAdminPin: (pin: string) => Promise<boolean>;
  clearAdminPin: () => void;
  /** Every question including the private review queue; admins only. */
  adminQuestions: QAQuestion[] | undefined;
  saveQuestion: (input: AdminSaveInput) => Promise<void>;
  setStatus: (questionId: string, status: QuestionStatus) => Promise<void>;
  deleteQuestion: (questionId: string) => Promise<void>;
}

export const QAContext = createContext<QAContextValue | null>(null);

export function useQA() {
  const context = useContext(QAContext);
  if (!context) throw new Error("useQA must be used within QAProvider");
  return context;
}

/** Turns a Convex or validation error into the sentence we show people. */
export function qaErrorMessage(error: unknown, fallback: string) {
  const data = error && typeof error === "object" && "data" in error ? (error as { data: unknown }).data : undefined;
  if (typeof data === "string") return data;
  if (error instanceof Error && error.message && !/\[CONVEX|Server Error/i.test(error.message)) return error.message;
  return fallback;
}
