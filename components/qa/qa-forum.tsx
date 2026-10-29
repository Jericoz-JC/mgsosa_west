"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FlaskConical, MessageCircleQuestion, Search, ShieldCheck } from "lucide-react";
import { conferences, GENERAL_CONFERENCE, isTopic, topics } from "@/lib/qa/conferences";
import { conferenceCounts, defaultFilters, filterQuestions, type QAFilters } from "@/lib/qa/filters";
import type { ClergyRole } from "@/lib/qa/types";
import { AskForm } from "./ask-form";
import { useQA } from "./qa-context";
import { QuestionCard } from "./question-card";
import styles from "./qa.module.css";

const conferenceChips = [
  { value: "all", label: "Everything" },
  { value: "conferences", label: "All MGSOSA conferences" },
  ...conferences.map((conference) => ({ value: conference.slug, label: conference.shortName })),
  { value: GENERAL_CONFERENCE, label: "General" },
];

function filtersFromParams(params: URLSearchParams): QAFilters {
  const conference = params.get("conference") ?? "all";
  const view = params.get("view") === "open" ? "open" : "answered";
  return {
    ...defaultFilters,
    conference: conferenceChips.some((chip) => chip.value === conference) ? conference : "all",
    view,
    topic: isTopic(params.get("topic") ?? "") ? params.get("topic")! : "all",
  };
}

export function QAForum() {
  const params = useSearchParams();
  const { questions, mode } = useQA();
  const [filters, setFilters] = useState<QAFilters>(() => filtersFromParams(new URLSearchParams(params.toString())));

  // Keep the shareable parts of the filter in the URL without a navigation.
  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.conference !== "all") next.set("conference", filters.conference);
    if (filters.view !== "answered") next.set("view", filters.view);
    if (filters.topic !== "all") next.set("topic", filters.topic);
    const query = next.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, [filters.conference, filters.view, filters.topic]);

  const visible = useMemo(() => filterQuestions(questions ?? [], filters), [questions, filters]);
  const counts = useMemo(() => conferenceCounts(questions ?? [], filters.view), [questions, filters.view]);
  const answeredTotal = questions?.filter((question) => question.status === "answered").length ?? 0;
  const openTotal = questions?.filter((question) => question.status === "open").length ?? 0;
  const activeConference = conferences.find((conference) => conference.slug === filters.conference);
  const filtered = filters.topic !== "all" || filters.clergy !== "all" || filters.search.trim() !== "";

  function update(patch: Partial<QAFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  return (
    <>
      {mode === "demo" ? (
        <div className={`container ${styles.demoBanner}`} role="note">
          <FlaskConical aria-hidden size={18} />
          <p><strong>Preview mode.</strong> These are sample questions to show the layout—none are real clergy answers. Connect Convex to use the live forum.</p>
        </div>
      ) : null}

      <div className={`container ${styles.layout}`}>
        <div className={styles.main}>
          <div className={styles.chips} role="group" aria-label="Filter by conference">
            {conferenceChips.map((chip) => (
              <button aria-pressed={filters.conference === chip.value} key={chip.value} onClick={() => update({ conference: chip.value })} type="button">
                {chip.label} <b>{counts[chip.value] ?? 0}</b>
              </button>
            ))}
          </div>

          <div className={styles.toolbar}>
            <div className={styles.tabs} role="tablist" aria-label="Question status">
              <button aria-selected={filters.view === "answered"} onClick={() => update({ view: "answered" })} role="tab" type="button">
                <ShieldCheck aria-hidden size={16} /> Answered <b>{answeredTotal}</b>
              </button>
              <button aria-selected={filters.view === "open"} onClick={() => update({ view: "open", clergy: "all" })} role="tab" type="button">
                <MessageCircleQuestion aria-hidden size={16} /> Awaiting answer <b>{openTotal}</b>
              </button>
            </div>
            <label className={styles.search}>
              <Search aria-hidden size={17} />
              <span className="sr-only">Search questions</span>
              <input onChange={(event) => update({ search: event.target.value })} placeholder="Search questions + answers" type="search" value={filters.search} />
            </label>
          </div>

          <div className={styles.selects}>
            <label>Topic
              <select onChange={(event) => update({ topic: event.target.value })} value={filters.topic}>
                <option value="all">All topics</option>
                {topics.map((topic) => <option key={topic}>{topic}</option>)}
              </select>
            </label>
            {filters.view === "answered" ? (
              <label>Answered by
                <select onChange={(event) => update({ clergy: event.target.value as ClergyRole | "all" })} value={filters.clergy}>
                  <option value="all">All clergy</option>
                  <option value="priest">Priests</option>
                  <option value="bishop">Bishops</option>
                  <option value="guest-speaker">Guest speakers</option>
                </select>
              </label>
            ) : null}
            <label>Sort
              <select onChange={(event) => update({ sort: event.target.value as QAFilters["sort"] })} value={filters.sort}>
                <option value="most-asked">Most asked</option>
                <option value="newest">Newest</option>
              </select>
            </label>
          </div>

          {activeConference ? (
            <p className={styles.context}>
              Showing questions from <strong>{activeConference.name}</strong>{activeConference.theme ? ` • ${activeConference.theme}` : ""}.
              {activeConference.eventSlug ? <> <Link href={`/events/${activeConference.eventSlug}`}>About this event</Link></> : null}
            </p>
          ) : null}

          <div className={styles.list} aria-live="polite" aria-busy={questions === undefined}>
            {questions === undefined ? (
              [0, 1, 2].map((key) => <div className={styles.skeleton} key={key} aria-hidden />)
            ) : visible.length ? (
              visible.map((question) => <QuestionCard key={question.id} question={question} />)
            ) : (
              <div className={styles.emptyState}>
                <h3>{filtered ? "No questions match these filters" : filters.view === "answered" ? "No answers here yet" : "No open questions here"}</h3>
                <p>{filtered ? "Try another topic or clear your search." : "Be the first to ask—your question goes to the admins for review."}</p>
                <div>
                  {filtered ? <button className="button button-ghost" onClick={() => update({ topic: "all", clergy: "all", search: "" })} type="button">Clear filters</button> : null}
                  <a className="button button-gold" href="#ask">Ask a question</a>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className={styles.aside}>
          <AskForm defaultConference={activeConference?.slug} />
        </aside>
      </div>
    </>
  );
}
