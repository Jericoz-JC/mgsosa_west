import { conferences, GENERAL_CONFERENCE } from "./conferences";
import type { ClergyRole, QAAnswer, QAQuestion } from "./types";

/** "all" = everything, "conferences" = any MGSOSA conference, otherwise a slug. */
export type ConferenceFilter = "all" | "conferences" | string;

export interface QAFilters {
  conference: ConferenceFilter;
  view: "answered" | "open";
  topic: string;
  clergy: ClergyRole | "all";
  search: string;
  sort: "most-asked" | "newest";
}

export const defaultFilters: QAFilters = {
  conference: "all",
  view: "answered",
  topic: "all",
  clergy: "all",
  search: "",
  sort: "most-asked",
};

export function matchesConference(question: QAQuestion, filter: ConferenceFilter) {
  if (filter === "all") return true;
  if (filter === "conferences") return question.conference !== GENERAL_CONFERENCE;
  return question.conference === filter;
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

export function filterQuestions(questions: QAQuestion[], filters: QAFilters) {
  const terms = normalize(filters.search).split(/\s+/).filter(Boolean);
  const result = questions.filter((question) => {
    if (question.status !== filters.view) return false;
    if (!matchesConference(question, filters.conference)) return false;
    if (filters.topic !== "all" && question.topic !== filters.topic) return false;
    if (filters.clergy !== "all" && question.answer?.role !== filters.clergy) return false;
    if (terms.length) {
      const haystack = normalize(`${question.body} ${question.answer?.body ?? ""} ${question.topic}`);
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    return true;
  });
  return result.sort((a, b) => {
    if (filters.sort === "most-asked" && b.votes !== a.votes) return b.votes - a.votes;
    return latestActivity(b) - latestActivity(a);
  });
}

function latestActivity(question: QAQuestion) {
  return question.answer?.answeredAt ?? question.createdAt;
}

/** Public attribution line for an answer, honoring the clergy's display choice. */
export function attributionLabel(answer: Pick<QAAnswer, "role" | "name" | "showName">) {
  const name = answer.name?.trim();
  if (answer.showName && name) {
    const role = answer.role === "guest-speaker" ? "Guest speaker" : answer.role === "bishop" ? "Bishop" : "Priest";
    return { verifiedBy: name, detail: role };
  }
  const generic = answer.role === "bishop" ? "a bishop" : answer.role === "guest-speaker" ? "a guest speaker" : "a priest";
  return { verifiedBy: `Verified by ${generic}`, detail: undefined };
}

/** Counts used by the filter chips, so empty filters read as empty before they're chosen. */
export function conferenceCounts(questions: QAQuestion[], view: QAFilters["view"]) {
  const visible = questions.filter((question) => question.status === view);
  const counts: Record<string, number> = {
    all: visible.length,
    conferences: visible.filter((question) => question.conference !== GENERAL_CONFERENCE).length,
    [GENERAL_CONFERENCE]: visible.filter((question) => question.conference === GENERAL_CONFERENCE).length,
  };
  for (const conference of conferences) {
    counts[conference.slug] = visible.filter((question) => question.conference === conference.slug).length;
  }
  return counts;
}
