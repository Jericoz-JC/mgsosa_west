"use client";

import { useState } from "react";
import { Hand, ShieldCheck } from "lucide-react";
import { conferenceName } from "@/lib/qa/conferences";
import { attributionLabel } from "@/lib/qa/filters";
import type { QAQuestion } from "@/lib/qa/types";
import { qaErrorMessage, useQA } from "./qa-context";
import styles from "./qa.module.css";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function askerLine(question: QAQuestion) {
  if (question.source === "admin") return "Asked at a session • added by MGSOSA West admins";
  if (question.askerName && question.askerName !== "Anonymous") {
    return `Asked by ${question.askerName}${question.askerChurch ? ` • ${question.askerChurch}` : ""}`;
  }
  return "Asked anonymously";
}

export function Attribution({ answer }: { answer: NonNullable<QAQuestion["answer"]> }) {
  const label = attributionLabel(answer);
  return (
    <div className={styles.attribution}>
      <ShieldCheck aria-hidden size={18} />
      <span>
        <strong>{label.verifiedBy}</strong>
        <small>{[label.detail, answer.session, dateFormat.format(answer.answeredAt)].filter(Boolean).join(" • ")}</small>
      </span>
    </div>
  );
}

export function QuestionCard({ question }: { question: QAQuestion }) {
  const { myVotes, toggleVote } = useQA();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const voted = myVotes.has(question.id);

  async function vote() {
    setBusy(true);
    setError(undefined);
    try {
      await toggleVote(question.id);
    } catch (cause) {
      setError(qaErrorMessage(cause, "Could not save that. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={styles.card} id={`q-${question.id}`}>
      <div className={styles.cardTags}>
        <span className={styles.conferenceTag}>{conferenceName(question.conference)}</span>
        <span className={styles.topicTag}>{question.topic}</span>
      </div>
      <h3 className={styles.question}>{question.body}</h3>
      <p className={styles.asker}>{askerLine(question)} • {dateFormat.format(question.createdAt)}</p>

      {question.answer ? (
        <div className={styles.answer}>
          {question.answer.body.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <Attribution answer={question.answer} />
        </div>
      ) : (
        <p className={styles.awaiting}>Awaiting a clergy-verified answer. Wondering the same thing? Let us know below.</p>
      )}

      <div className={styles.cardFooter}>
        <button aria-pressed={voted} className={styles.voteButton} disabled={busy} onClick={vote} type="button">
          <Hand aria-hidden size={16} />
          <span>{voted ? "You asked this too" : "I’ve wondered this too"}</span>
          <b aria-label={`${question.votes} people`}>{question.votes}</b>
        </button>
        {error ? <span className="form-error" role="alert">{error}</span> : null}
      </div>
    </article>
  );
}
