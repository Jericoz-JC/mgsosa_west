"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { conferences, GENERAL_CONFERENCE, isTopic, topics } from "@/lib/qa/conferences";
import { QA_LIMITS, validateAsk } from "@/lib/qa/validation";
import { WEST_REGION_CHURCHES } from "@/lib/game/churches";
import { qaErrorMessage, useQA } from "./qa-context";
import styles from "./qa.module.css";

const emptyForm = { body: "", conference: GENERAL_CONFERENCE, topic: "", askerName: "", askerChurch: "" };

export function AskForm({ defaultConference }: { defaultConference?: string }) {
  const { ask } = useQA();
  const [values, setValues] = useState({ ...emptyForm, conference: defaultConference ?? GENERAL_CONFERENCE });
  const [shareName, setShareName] = useState(false);
  const [error, setError] = useState<{ message: string; field: "body" | "topic" }>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Arriving from an "Ask a question" link puts the cursor in the question box.
  useEffect(() => {
    const focusIfAsked = () => { if (window.location.hash === "#ask") bodyRef.current?.focus({ preventScroll: true }); };
    focusIfAsked();
    window.addEventListener("hashchange", focusIfAsked);
    return () => window.removeEventListener("hashchange", focusIfAsked);
  }, []);
  const [followedConference, setFollowedConference] = useState(defaultConference);
  if (defaultConference !== followedConference) {
    // Follow the conference chip the visitor picks, without clearing their draft.
    setFollowedConference(defaultConference);
    setValues((current) => ({ ...current, conference: defaultConference ?? GENERAL_CONFERENCE }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      body: values.body,
      conference: values.conference,
      topic: values.topic,
      askerName: shareName ? values.askerName : undefined,
      askerChurch: shareName ? values.askerChurch : undefined,
    };
    const result = validateAsk(input);
    if (!result.ok) {
      // validateAsk checks the question before the topic, so a missing topic is
      // the failure only when the question itself is long enough.
      const field = !isTopic(values.topic) && values.body.trim().length >= QA_LIMITS.questionMin ? "topic" : "body";
      setError({ message: result.error, field });
      document.getElementById(field === "topic" ? "ask-topic" : "ask-body")?.focus();
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await ask(result.value);
      setSent(true);
      setValues({ ...emptyForm, conference: values.conference });
      setShareName(false);
    } catch (cause) {
      setError({ message: qaErrorMessage(cause, "Your question could not be sent. Check your connection and try again."), field: "body" });
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className={styles.askPanel} id="ask" role="status">
        <CheckCircle2 aria-hidden className={styles.sentIcon} size={34} />
        <h2>Question received</h2>
        <p>Thank you! An MGSOSA West admin will review it. Once it’s approved it appears under <strong>Awaiting answer</strong>, and a clergy-verified answer is added when it’s ready.</p>
        <button className="button button-ghost" onClick={() => setSent(false)} type="button">Ask another question</button>
      </div>
    );
  }

  return (
    <form className={styles.askPanel} id="ask" noValidate onSubmit={submit}>
      <p className="eyebrow">Ask the Clergy</p>
      <h2>Ask a question</h2>
      <p>Questions are reviewed by admins before they appear. Answers are verified by a priest, bishop, or guest speaker.</p>

      <div className="field">
        <label htmlFor="ask-body">Your question</label>
        <textarea
          id="ask-body"
          maxLength={QA_LIMITS.questionMax}
          onChange={(event) => setValues({ ...values, body: event.target.value })}
          placeholder="Why do we face east when we pray?"
          value={values.body}
          ref={bodyRef}
          aria-describedby={error?.field === "body" ? "ask-error ask-body-help" : "ask-body-help"}
          aria-invalid={error?.field === "body"}
        />
        <small id="ask-body-help">{values.body.length}/{QA_LIMITS.questionMax} • Please leave out personal details like phone numbers or last names.</small>
      </div>

      <div className={styles.formRow}>
        <div className="field">
          <label htmlFor="ask-conference">Where did it come up?</label>
          <select id="ask-conference" onChange={(event) => setValues({ ...values, conference: event.target.value })} value={values.conference}>
            <option value={GENERAL_CONFERENCE}>General / anytime</option>
            {conferences.map((conference) => <option key={conference.slug} value={conference.slug}>{conference.shortName}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ask-topic">Topic</label>
          <select aria-describedby={error?.field === "topic" ? "ask-error" : undefined} aria-invalid={error?.field === "topic"} id="ask-topic" onChange={(event) => setValues({ ...values, topic: event.target.value })} value={values.topic}>
            <option value="">Choose a topic</option>
            {topics.map((topic) => <option key={topic}>{topic}</option>)}
          </select>
        </div>
      </div>

      <label className={styles.checkbox}>
        <input checked={shareName} onChange={(event) => setShareName(event.target.checked)} type="checkbox" />
        <span>Show my first name with the question <small>Otherwise it’s posted anonymously.</small></span>
      </label>

      {shareName ? (
        <div className={styles.formRow}>
          <div className="field">
            <label htmlFor="ask-name">First name</label>
            <input autoComplete="given-name" id="ask-name" maxLength={QA_LIMITS.nameMax} onChange={(event) => setValues({ ...values, askerName: event.target.value })} value={values.askerName} />
          </div>
          <div className="field">
            <label htmlFor="ask-church">Church (optional)</label>
            <select id="ask-church" onChange={(event) => setValues({ ...values, askerChurch: event.target.value })} value={values.askerChurch}>
              <option value="">Prefer not to say</option>
              {WEST_REGION_CHURCHES.map((church) => <option key={church}>{church}</option>)}
            </select>
          </div>
        </div>
      ) : null}

      {error ? <p className="form-error" id="ask-error" role="alert">{error.message}</p> : null}
      <button className="button button-gold" disabled={busy} type="submit"><Send aria-hidden size={17} /> {busy ? "Sending…" : "Send for review"}</button>
    </form>
  );
}
