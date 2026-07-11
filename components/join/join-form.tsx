"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ConvexError } from "convex/values";
import { useGame } from "@/components/game/game-provider";
import { OTHER_CHURCH_VALUE, WEST_REGION_CHURCHES } from "@/lib/game/churches";
import { matchesEventCode, safeJoin } from "@/lib/game/join";

export function JoinForm() {
  const router = useRouter();
  const { join, state } = useGame();
  const [values, setValues] = useState({ eventCode: state.eventCode, name: "", church: "" });
  const [churchChoice, setChurchChoice] = useState("");
  const [error, setError] = useState<string>();
  const [joining, setJoining] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = safeJoin(values);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }
    if (!matchesEventCode(result.data.eventCode, state.eventCode)) {
      setError(`This game-night link uses event code ${state.eventCode}.`);
      return;
    }
    setJoining(true);
    setError(undefined);
    try {
      await join(result.data);
      router.push("/play");
    } catch (cause) {
      setError(cause instanceof ConvexError ? String(cause.data) : "Could not join the event. Try again in a moment.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <form className="join-form" onSubmit={submit} noValidate>
      <div className="join-form-heading">
        <span className="status-pill status-live">Event lobby open</span>
        <h2>Join game night</h2>
        <p>No account. No download. You’ll be in the lobby in a few seconds.</p>
      </div>

      <div className="field">
        <label htmlFor="eventCode">Event code</label>
        <input
          id="eventCode"
          name="eventCode"
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="one-time-code"
          value={values.eventCode}
          onChange={(event) => setValues({ ...values, eventCode: event.target.value.toUpperCase() })}
          placeholder="WEST26"
        />
      </div>
      <div className="field">
        <label htmlFor="name">First name or nickname</label>
        <input
          id="name"
          name="name"
          autoComplete="given-name"
          value={values.name}
          onChange={(event) => setValues({ ...values, name: event.target.value })}
          placeholder="Maya"
        />
      </div>
      <div className="field">
        <label htmlFor="church">Church</label>
        <select
          id="church"
          name="church"
          value={churchChoice}
          onChange={(event) => {
            const choice = event.target.value;
            setChurchChoice(choice);
            setValues({ ...values, church: choice === OTHER_CHURCH_VALUE ? "" : choice });
          }}
        >
          <option value="">Choose your church</option>
          {WEST_REGION_CHURCHES.map((church) => <option key={church}>{church}</option>)}
          <option value={OTHER_CHURCH_VALUE}>Other church / visiting</option>
        </select>
      </div>

      {churchChoice === OTHER_CHURCH_VALUE ? (
        <div className="field other-church-field">
          <label htmlFor="otherChurch">Enter your church</label>
          <input
            id="otherChurch"
            name="otherChurch"
            autoComplete="organization"
            maxLength={64}
            value={values.church}
            onChange={(event) => setValues({ ...values, church: event.target.value })}
            placeholder="Church name + city"
            aria-describedby="other-church-help"
          />
          <small id="other-church-help">This will be visible to event staff exactly as entered.</small>
        </div>
      ) : null}

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <button className="button button-gold join-submit" disabled={joining} type="submit">
        {joining ? "Joining…" : "Enter the lobby"} <ArrowRight aria-hidden size={19} />
      </button>
      <p className="privacy-note"><CheckCircle2 aria-hidden size={15} /> We only save your game name, church, and score for this event.</p>
    </form>
  );
}
