"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Gamepad2, KeyRound, LayoutDashboard, MonitorUp, RotateCcw, UsersRound } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { useGame } from "@/components/game/game-provider";
import styles from "./host-shell.module.css";

const nav = [
  { href: "/host", label: "Overview", icon: LayoutDashboard },
  { href: "/host/jeopardy", label: "Jeopardy", icon: Gamepad2 },
  { href: "/host/room", label: "Breakout rooms", icon: UsersRound },
  { href: "/display", label: "Display", icon: MonitorUp, external: true },
];

function HostPinGate() {
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
    <main className="page-shell" style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "2rem" }}>
      <form className="join-form" onSubmit={submit} style={{ maxWidth: "26rem", width: "100%" }}>
        <div className="join-form-heading">
          <span className="status-pill status-live"><KeyRound size={13} /> Staff access</span>
          <h2>Host console</h2>
          <p>Enter the host PIN to control the live event. Participants never need this.</p>
        </div>
        <div className="field">
          <label htmlFor="hostPin">Host PIN</label>
          <input
            id="hostPin"
            name="hostPin"
            type="password"
            autoComplete="off"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="Host PIN"
          />
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button button-gold join-submit" disabled={checking || !pin.trim()} type="submit">
          {checking ? "Checking…" : "Unlock host console"}
        </button>
      </form>
    </main>
  );
}

export function HostShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, reset, mode, hostPin, clearHostPin } = useGame();

  if (mode === "convex" && !hostPin) return <HostPinGate />;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <BrandLockup href="/host" inverse />
        <nav aria-label="Game Master navigation">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/host" ? pathname === "/host" : pathname.startsWith(item.href);
            return (
              <Link className={active ? styles.active : undefined} href={item.href} key={item.href} target={item.external ? "_blank" : undefined}>
                <Icon aria-hidden size={19} />
                <span>{item.label}</span>
                {item.external ? <ExternalLink className={styles.external} aria-hidden size={13} /> : null}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarFooter}>
          <div>
            <span className="status-pill status-live">Live</span>
            <strong>{state.eventCode}</strong>
            <small>{mode === "convex" ? "Hosted realtime sync" : `${state.players.filter((player) => player.connected).length} demo players connected`}</small>
          </div>
          {mode === "convex" ? (
            <button onClick={clearHostPin} type="button"><KeyRound aria-hidden size={15} /> Lock console</button>
          ) : (
            <button onClick={reset} type="button"><RotateCcw aria-hidden size={15} /> Reset demo</button>
          )}
        </div>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
