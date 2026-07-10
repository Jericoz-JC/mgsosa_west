"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useGame } from "@/components/game/game-provider";

type StaffAccess = "host" | "room";

function PinForm({ access }: { access: StaffAccess }) {
  const { submitHostPin, submitRoomPin } = useGame();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setChecking(true);
    setError(undefined);
    try {
      const valid = await (access === "host" ? submitHostPin(pin.trim()) : submitRoomPin(pin.trim()));
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
          <h2>{access === "host" ? "Game Master console" : "Room staff console"}</h2>
          <p>
            Enter the {access === "host" ? "Game Master" : "room staff"} PIN.
            {access === "room" ? " This PIN cannot open Game Master controls." : " Participants never need this."}
          </p>
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
 * Blocks staff surfaces (host console, room-admin console) until the host PIN
 * has been verified against the Convex deployment. Demo mode passes through.
 */
export function StaffPinGate({ children, access = "host" }: { children: React.ReactNode; access?: StaffAccess }) {
  const { mode, hostPin, roomPin } = useGame();
  const authorized = access === "host" ? hostPin : roomPin || hostPin;
  if (mode === "convex" && !authorized) return <PinForm access={access} />;
  return <>{children}</>;
}
