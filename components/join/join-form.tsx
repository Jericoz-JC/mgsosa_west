"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { safeJoin } from "@/lib/game/join";

const churches = [
  "St. Mary’s",
  "St. George",
  "St. Thomas",
  "St. Peter",
  "St. Gregorios",
  "Other / Visiting",
];

export function JoinForm() {
  const router = useRouter();
  const [values, setValues] = useState({ eventCode: "WEST26", name: "", church: "" });
  const [error, setError] = useState<string>();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = safeJoin(values);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check your details and try again.");
      return;
    }
    window.localStorage.setItem(
      "mgsosa-west-player",
      JSON.stringify({ ...result.data, playerId: "player-maya", teamId: "pacific", rotationGroup: "A" }),
    );
    router.push("/play");
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
          value={values.church}
          onChange={(event) => setValues({ ...values, church: event.target.value })}
        >
          <option value="">Choose your church</option>
          {churches.map((church) => <option key={church}>{church}</option>)}
        </select>
      </div>

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <button className="button button-gold join-submit" type="submit">
        Enter the lobby <ArrowRight aria-hidden size={19} />
      </button>
      <p className="privacy-note"><CheckCircle2 aria-hidden size={15} /> We only save your game name, church, and score for this event.</p>
    </form>
  );
}
