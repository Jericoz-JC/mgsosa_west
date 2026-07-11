"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useGame } from "@/components/game/game-provider";

function PinForm() {
  const { submitHostPin } = useGame();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    setError(undefined);
    try {
      const valid = await submitHostPin(pin.trim());
      if (!valid) setError("That PIN was not accepted. Check with the Game Master.");
    } catch {
      setError("Could not verify the PIN. Check your connection and try again.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="page-shell" style={{ display: "grid", placeItems: "center", minHeight: "70vh", padding: "2rem" }}>
      <form className="join-form" onSubmit={submit} style={{ maxWidth: "26rem", width: "100%" }}>
        <div className="join-form-heading">
          <span className="status-pill status-live"><KeyRound size={13} /> Staff access</span>
          <h2>Game Master console</h2>
          <p>Enter the Game Master PIN. Participants and room volunteers never need it.</p>
        </div>
        <div className="field">
          <label htmlFor="hostPin">Staff PIN</label>
          <input
            id="hostPin"
            name="hostPin"
            type="password"
            autoComplete="off"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Staff PIN"
          />
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button button-gold join-submit" disabled={checking || !pin.trim()} type="submit">
          {checking ? "Checking…" : "Unlock console"}
        </button>
      </form>
    </div>
  );
}

/**
 * Blocks Game Master surfaces until the host PIN has been verified against the
 * Convex deployment. Room volunteers use scoped private links instead.
 */
export function StaffPinGate({ children }: { children: React.ReactNode }) {
  const { mode, hostPin } = useGame();
  if (mode === "convex" && !hostPin) return <PinForm />;
  return <>{children}</>;
}
