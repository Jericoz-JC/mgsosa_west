"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { hasConvex } from "@/components/convex/convex-client-provider";
import { useStaffSession } from "@/components/staff/use-staff-session";
import { createSampleQuestions } from "@/lib/qa/sample";
import type { AdminSaveInput, AskInput, QAQuestion, QuestionStatus } from "@/lib/qa/types";
import { validateAdminSave, validateAsk } from "@/lib/qa/validation";
import { QAContext, type QAContextValue } from "./qa-context";

export { useQA } from "./qa-context";

const VISITOR_TOKEN_KEY = "mgsosa-west-qa-visitor";
const DEMO_STORAGE_KEY = "mgsosa-west-qa-demo-v1";
const DEMO_VOTES_KEY = "mgsosa-west-qa-demo-votes-v1";

/** A random per-browser id so votes and question limits work without accounts. */
function getVisitorToken() {
  let token = window.localStorage.getItem(VISITOR_TOKEN_KEY);
  if (!token || !/^[A-Za-z0-9_-]{24,128}$/.test(token)) {
    token = `${crypto.randomUUID().replace(/-/g, "")}${Date.now().toString(36)}`;
    window.localStorage.setItem(VISITOR_TOKEN_KEY, token);
  }
  return token;
}

function isPublished(question: QAQuestion) {
  return question.status === "open" || question.status === "answered";
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function DemoQAProvider({ children }: { children: React.ReactNode }) {
  const [all, setAll] = useState<QAQuestion[]>();
  const [votes, setVotes] = useState<string[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setAll(readJson(DEMO_STORAGE_KEY, createSampleQuestions()));
      setVotes(readJson(DEMO_VOTES_KEY, []));
    });
  }, []);

  const persist = useCallback((next: QAQuestion[]) => {
    setAll(next);
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const value = useMemo<QAContextValue>(() => {
    const current = all ?? [];
    return {
      mode: "demo",
      questions: all?.filter(isPublished),
      myVotes: new Set(votes),
      ask: async (input: AskInput) => {
        const result = validateAsk(input);
        if (!result.ok) throw new Error(result.error);
        persist([{ ...result.value, id: `demo-${Date.now()}`, status: "submitted", source: "community", votes: 0, createdAt: Date.now() }, ...current]);
      },
      toggleVote: async (questionId: string) => {
        const voted = votes.includes(questionId);
        const nextVotes = voted ? votes.filter((id) => id !== questionId) : [...votes, questionId];
        setVotes(nextVotes);
        window.localStorage.setItem(DEMO_VOTES_KEY, JSON.stringify(nextVotes));
        persist(current.map((question) => question.id === questionId ? { ...question, votes: Math.max(0, question.votes + (voted ? -1 : 1)) } : question));
      },
      adminPin: "demo",
      submitAdminPin: async () => ({ ok: true }),
      clearAdminPin: () => {},
      adminQuestions: all,
      saveQuestion: async (input: AdminSaveInput) => {
        const result = validateAdminSave(input);
        if (!result.ok) throw new Error(result.error);
        const { id, answer, ...rest } = result.value;
        const existing = current.find((question) => question.id === id);
        const stamped = answer ? { ...answer, answeredAt: existing?.answer?.body === answer.body ? existing.answer.answeredAt : Date.now() } : undefined;
        if (existing) {
          persist(current.map((question) => question.id === id ? { ...question, ...rest, answer: stamped } : question));
        } else {
          persist([{ ...rest, answer: stamped, id: `demo-${Date.now()}`, source: "admin", votes: 0, createdAt: Date.now() }, ...current]);
        }
      },
      setStatus: async (questionId: string, status: QuestionStatus) => {
        const question = current.find((candidate) => candidate.id === questionId);
        if (status === "answered" && !question?.answer) throw new Error("Add the clergy-verified answer before publishing it as answered.");
        persist(current.map((candidate) => candidate.id === questionId
          ? { ...candidate, status, restoreTo: status === "hidden" && candidate.status !== "hidden" ? candidate.status : undefined }
          : candidate));
      },
      deleteQuestion: async (questionId: string) => persist(current.filter((question) => question.id !== questionId)),
    };
  }, [all, votes, persist]);

  return <QAContext.Provider value={value}>{children}</QAContext.Provider>;
}

function ConvexQAProvider({ children }: { children: React.ReactNode }) {
  const [visitorToken, setVisitorToken] = useState<string>();
  const { token: adminPin, signIn: signInStaff, clear: clearStaff } = useStaffSession("qa-admin");

  useEffect(() => {
    let cancelled = false;
    const token = getVisitorToken();
    queueMicrotask(() => { if (!cancelled) setVisitorToken(token); });
    return () => { cancelled = true; };
  }, []);

  const questions = useQuery(api.qa.list, {});
  const voteIds = useQuery(api.qa.myVotes, visitorToken ? { voterToken: visitorToken } : "skip");
  const adminQuestions = useQuery(api.qa.adminList, adminPin ? { staffToken: adminPin } : "skip");
  // adminList returns null once the server-side session expires or is revoked.
  useEffect(() => {
    if (adminPin && adminQuestions === null) clearStaff(false);
  }, [adminPin, adminQuestions, clearStaff]);
  const askMutation = useMutation(api.qa.ask);
  const voteMutation = useMutation(api.qa.toggleVote);
  const saveMutation = useMutation(api.qa.adminSave);
  const statusMutation = useMutation(api.qa.adminSetStatus);
  const deleteMutation = useMutation(api.qa.adminDelete);

  const requirePin = useCallback(() => {
    if (!adminPin) throw new Error("Moderator access is required.");
    return adminPin;
  }, [adminPin]);

  const value = useMemo<QAContextValue>(() => ({
    mode: "convex",
    questions: questions as QAQuestion[] | undefined,
    myVotes: new Set((voteIds ?? []).map(String)),
    ask: async (input) => {
      const result = validateAsk(input);
      if (!result.ok) throw new Error(result.error);
      await askMutation({ ...result.value, askerToken: visitorToken ?? getVisitorToken() });
    },
    toggleVote: async (questionId) => {
      await voteMutation({ questionId: questionId as Id<"qaQuestions">, voterToken: visitorToken ?? getVisitorToken() });
    },
    adminPin,
    submitAdminPin: signInStaff,
    clearAdminPin: () => clearStaff(),
    adminQuestions: (adminQuestions ?? undefined) as QAQuestion[] | undefined,
    saveQuestion: async ({ id, ...input }) => {
      const result = validateAdminSave({ id, ...input });
      if (!result.ok) throw new Error(result.error);
      await saveMutation({
        staffToken: requirePin(),
        id: id as Id<"qaQuestions"> | undefined,
        body: result.value.body,
        conference: result.value.conference,
        topic: result.value.topic,
        status: result.value.status,
        answer: result.value.answer,
      });
    },
    setStatus: async (questionId, status) => {
      await statusMutation({ staffToken: requirePin(), id: questionId as Id<"qaQuestions">, status });
    },
    deleteQuestion: async (questionId) => {
      await deleteMutation({ staffToken: requirePin(), id: questionId as Id<"qaQuestions"> });
    },
  }), [questions, voteIds, adminQuestions, adminPin, visitorToken, askMutation, voteMutation, saveMutation, statusMutation, deleteMutation, signInStaff, clearStaff, requirePin]);

  return <QAContext.Provider value={value}>{children}</QAContext.Provider>;
}

export function QAProvider({ children }: { children: React.ReactNode }) {
  if (hasConvex) return <ConvexQAProvider>{children}</ConvexQAProvider>;
  return <DemoQAProvider>{children}</DemoQAProvider>;
}
