"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, EyeOff, FlaskConical, KeyRound, LogOut, PencilLine, Plus, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { conferenceName, conferences, GENERAL_CONFERENCE, topics } from "@/lib/qa/conferences";
import { attributionLabel } from "@/lib/qa/filters";
import { clergyRoleLabel, type ClergyRole, type QAQuestion, type QuestionStatus } from "@/lib/qa/types";
import { QA_LIMITS } from "@/lib/qa/validation";
import { qaErrorMessage, useQA } from "./qa-context";
import { askerLine } from "./question-card";
import styles from "./qa.module.css";

const tabs: Array<{ status: QuestionStatus; label: string; empty: string }> = [
  { status: "submitted", label: "Review queue", empty: "No new submissions. You’re all caught up." },
  { status: "open", label: "Awaiting answer", empty: "No approved questions are waiting on an answer." },
  { status: "answered", label: "Answered", empty: "No published answers yet." },
  { status: "hidden", label: "Hidden", empty: "Nothing hidden." },
];

interface Draft {
  id?: string;
  body: string;
  conference: string;
  topic: string;
  answerBody: string;
  role: ClergyRole;
  name: string;
  showName: boolean;
  session: string;
}

function draftFrom(question?: QAQuestion): Draft {
  return {
    id: question?.id,
    body: question?.body ?? "",
    conference: question?.conference ?? GENERAL_CONFERENCE,
    topic: question?.topic ?? "",
    answerBody: question?.answer?.body ?? "",
    role: question?.answer?.role ?? "priest",
    name: question?.answer?.name ?? "",
    showName: question?.answer?.showName ?? false,
    session: question?.answer?.session ?? "",
  };
}

function PinGate() {
  const { submitAdminPin } = useQA();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      if (!(await submitAdminPin(pin.trim()))) setError("That PIN was not accepted.");
    } catch {
      setError("Could not verify the PIN. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`${styles.askPanel} ${styles.pinGate}`} onSubmit={submit}>
      <span className="status-pill status-live"><KeyRound size={13} /> Moderators only</span>
      <h2>Ask the Clergy admin</h2>
      <p>Enter the moderator PIN to review submissions and publish clergy-verified answers.</p>
      <div className="field">
        <label htmlFor="admin-pin">Moderator PIN</label>
        <input autoComplete="off" id="admin-pin" onChange={(event) => setPin(event.target.value)} type="password" value={pin} />
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="button button-gold" disabled={busy || !pin.trim()} type="submit">{busy ? "Checking…" : "Unlock"}</button>
    </form>
  );
}

function Editor({ initial, onDone }: { initial: Draft; onDone: (message: string) => void }) {
  const { saveQuestion } = useQA();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const hasAnswer = draft.answerBody.trim().length > 0;
  const preview = attributionLabel({ role: draft.role, name: draft.name, showName: draft.showName });

  async function save(status: QuestionStatus) {
    setBusy(true);
    setError(undefined);
    try {
      await saveQuestion({
        id: draft.id,
        body: draft.body,
        conference: draft.conference,
        topic: draft.topic,
        status,
        answer: hasAnswer
          ? { body: draft.answerBody, role: draft.role, name: draft.name, showName: draft.showName, session: draft.session }
          : undefined,
      });
      onDone(status === "answered" ? "Answer published." : "Saved.");
    } catch (cause) {
      setError(qaErrorMessage(cause, "Could not save. Check the fields and try again."));
    } finally {
      setBusy(false);
    }
  }

  const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <section className={styles.editor} aria-label={draft.id ? "Edit question" : "Add question"}>
      <div className={styles.editorHead}>
        <div><p className="eyebrow">{draft.id ? "Edit + answer" : "Add a question"}</p><h2>{draft.id ? "Answer this question" : "Enter a question from a session"}</h2></div>
        <button className="button button-ghost" onClick={() => onDone("")} type="button">Cancel</button>
      </div>

      <div className="field">
        <label htmlFor="edit-body">Question</label>
        <textarea id="edit-body" maxLength={QA_LIMITS.questionMax} onChange={(event) => set({ body: event.target.value })} value={draft.body} />
      </div>
      <div className={styles.formRow}>
        <div className="field">
          <label htmlFor="edit-conference">Conference</label>
          <select id="edit-conference" onChange={(event) => set({ conference: event.target.value })} value={draft.conference}>
            <option value={GENERAL_CONFERENCE}>General</option>
            {conferences.map((conference) => <option key={conference.slug} value={conference.slug}>{conference.shortName}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="edit-topic">Topic</label>
          <select id="edit-topic" onChange={(event) => set({ topic: event.target.value })} value={draft.topic}>
            <option value="">Choose a topic</option>
            {topics.map((topic) => <option key={topic}>{topic}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.answerFields}>
        <div className="field">
          <label htmlFor="edit-answer">Clergy-verified answer</label>
          <textarea id="edit-answer" maxLength={QA_LIMITS.answerMax} onChange={(event) => set({ answerBody: event.target.value })} placeholder="Write the answer as given or approved by the clergy member. Blank lines start new paragraphs." rows={8} value={draft.answerBody} />
          <small>Only publish answers that a priest, bishop, or the guest speaker has given or reviewed.</small>
        </div>
        <fieldset className={styles.roleField}>
          <legend>Verified by</legend>
          {(Object.keys(clergyRoleLabel) as ClergyRole[]).map((role) => (
            <label key={role}><input checked={draft.role === role} name="role" onChange={() => set({ role })} type="radio" /> {clergyRoleLabel[role]}</label>
          ))}
        </fieldset>
        <div className={styles.formRow}>
          <div className="field">
            <label htmlFor="edit-name">Clergy name</label>
            <input id="edit-name" maxLength={QA_LIMITS.clergyNameMax} onChange={(event) => set({ name: event.target.value })} placeholder="Fr. Lazarus Yassa" value={draft.name} />
          </div>
          <div className="field">
            <label htmlFor="edit-session">Session (optional)</label>
            <input id="edit-session" maxLength={QA_LIMITS.sessionMax} onChange={(event) => set({ session: event.target.value })} placeholder="Saturday Q&A panel" value={draft.session} />
          </div>
        </div>
        <fieldset className={styles.roleField}>
          <legend>Show on the website as</legend>
          <label><input checked={!draft.showName} name="showName" onChange={() => set({ showName: false })} type="radio" /> Just the role</label>
          <label><input checked={draft.showName} name="showName" onChange={() => set({ showName: true })} type="radio" /> Their name</label>
        </fieldset>
        <div className={styles.attributionPreview}>
          <ShieldCheck aria-hidden size={18} />
          <span><small>Preview</small><strong>{preview.verifiedBy}</strong>{preview.detail ? <em>{preview.detail}</em> : null}</span>
        </div>
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className={styles.editorActions}>
        <button className="button button-gold" disabled={busy || !hasAnswer} onClick={() => save("answered")} type="button"><ShieldCheck aria-hidden size={17} /> Publish answer</button>
        <button className="button button-ghost" disabled={busy} onClick={() => save("open")} type="button">Save as awaiting answer</button>
      </div>
    </section>
  );
}

export function QAAdmin() {
  const { mode, adminPin, clearAdminPin, adminQuestions, setStatus, deleteQuestion } = useQA();
  const [tab, setTab] = useState<QuestionStatus>("submitted");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [message, setMessage] = useState<string>();
  const [busyId, setBusyId] = useState<string>();

  const counts = useMemo(() => {
    const result: Record<QuestionStatus, number> = { submitted: 0, open: 0, answered: 0, hidden: 0 };
    for (const question of adminQuestions ?? []) result[question.status] += 1;
    return result;
  }, [adminQuestions]);

  if (mode === "convex" && !adminPin) return <div className="container" style={{ paddingBlock: 56 }}><PinGate /></div>;

  const list = (adminQuestions ?? []).filter((question) => question.status === tab).sort((a, b) => b.createdAt - a.createdAt);
  const current = tabs.find((item) => item.status === tab)!;

  async function act(question: QAQuestion, action: () => Promise<void>, done: string) {
    setBusyId(question.id);
    setMessage(undefined);
    try {
      await action();
      setMessage(done);
    } catch (cause) {
      setMessage(qaErrorMessage(cause, "That action failed. Try again."));
    } finally {
      setBusyId(undefined);
    }
  }

  function finishEditing(result: string) {
    setEditing(null);
    if (result) setMessage(result);
  }

  return (
    <div className={`container ${styles.admin}`}>
      {mode === "demo" ? (
        <div className={styles.demoBanner} role="note">
          <FlaskConical aria-hidden size={18} />
          <p><strong>Preview mode.</strong> Changes are saved only in this browser. Connect Convex and set QA_ADMIN_PIN for the live forum.</p>
        </div>
      ) : null}

      <header className={styles.adminHead}>
        <div>
          <p className="eyebrow">Moderator console</p>
          <h1 className="section-title">Ask the Clergy admin</h1>
          <p className="muted">Approve community questions, enter questions asked live at conferences, and publish answers once clergy have verified them.</p>
        </div>
        <div className={styles.adminActions}>
          <button className="button button-dark" onClick={() => { setEditing(draftFrom()); setMessage(undefined); }} type="button"><Plus aria-hidden size={17} /> Add question</button>
          <Link className="button button-ghost" href="/qa">View public page</Link>
          {mode === "convex" ? <button className="button button-ghost" onClick={clearAdminPin} type="button"><LogOut aria-hidden size={16} /> Lock</button> : null}
        </div>
      </header>

      {message ? <p className={styles.adminMessage} role="status">{message}</p> : null}
      {editing ? <Editor initial={editing} key={editing.id ?? "new"} onDone={finishEditing} /> : null}

      <div className={styles.tabs} role="tablist" aria-label="Moderation status">
        {tabs.map((item) => (
          <button aria-selected={tab === item.status} key={item.status} onClick={() => setTab(item.status)} role="tab" type="button">
            {item.label} <b>{counts[item.status]}</b>
          </button>
        ))}
      </div>

      <div className={styles.adminList}>
        {adminQuestions === undefined ? <div className={styles.skeleton} aria-hidden /> : list.length ? list.map((question) => (
          <article className={styles.adminRow} key={question.id}>
            <div>
              <div className={styles.cardTags}>
                <span className={styles.conferenceTag}>{conferenceName(question.conference)}</span>
                <span className={styles.topicTag}>{question.topic}</span>
                {question.votes ? <span className={styles.topicTag}>{question.votes} also asked</span> : null}
              </div>
              <h3 className={styles.question}>{question.body}</h3>
              <p className={styles.asker}>{askerLine(question)} • {new Date(question.createdAt).toLocaleDateString()}</p>
              {question.answer ? (
                <p className={styles.adminAnswer}>
                  <strong>{question.status === "answered" ? "Published answer" : "Draft answer"} • {attributionLabel(question.answer).verifiedBy}</strong>
                  {question.answer.body.slice(0, 220)}{question.answer.body.length > 220 ? "…" : ""}
                </p>
              ) : null}
            </div>
            <div className={styles.rowActions}>
              {question.status === "submitted" ? (
                <button className="button button-dark" disabled={busyId === question.id} onClick={() => act(question, () => setStatus(question.id, "open"), "Approved. It now shows under Awaiting answer.")} type="button"><Check aria-hidden size={16} /> Approve</button>
              ) : null}
              {question.status !== "hidden" ? (
                <button className="button button-ghost" disabled={busyId === question.id} onClick={() => { setEditing(draftFrom(question)); setMessage(undefined); window.scrollTo({ top: 0, behavior: "smooth" }); }} type="button"><PencilLine aria-hidden size={16} /> {question.answer ? "Edit answer" : "Answer"}</button>
              ) : null}
              {question.status === "hidden" ? (
                <button className="button button-ghost" disabled={busyId === question.id} onClick={() => act(question, () => setStatus(question.id, question.restoreTo ?? "submitted"), question.restoreTo === "answered" ? "Restored to Answered." : question.restoreTo === "open" ? "Restored to Awaiting answer." : "Restored to the review queue.")} type="button"><RotateCcw aria-hidden size={16} /> Restore</button>
              ) : (
                <button className="button button-ghost" disabled={busyId === question.id} onClick={() => act(question, () => setStatus(question.id, "hidden"), "Hidden from the public page.")} type="button"><EyeOff aria-hidden size={16} /> Hide</button>
              )}
              <button className={styles.deleteButton} disabled={busyId === question.id} onClick={() => { if (window.confirm("Delete this question permanently?")) void act(question, () => deleteQuestion(question.id), "Deleted."); }} type="button"><Trash2 aria-hidden size={15} /> Delete</button>
            </div>
          </article>
        )) : <p className={styles.emptyState}>{current.empty}</p>}
      </div>
    </div>
  );
}
