"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Church, Clock3, Copy, Gamepad2, Radio, Trash2, UsersRound } from "lucide-react";
import { useGame } from "@/components/game/game-provider";
import { ScoreStrip } from "@/components/game/score-strip";
import type { EventPhase } from "@/lib/game/types";
import { timestamp } from "@/lib/game/time";
import styles from "./host.module.css";

const phases: Array<{ phase: EventPhase; time: string; label: string; message: string }> = [
  { phase: "lobby", time: "5:30", label: "Welcome + lobby", message: "Welcome • Check your team and rotation" },
  { phase: "rotation-one", time: "5:40", label: "Rotation one", message: "Rotation 1 • Join your assigned breakout room" },
  { phase: "switching", time: "6:00", label: "Room switch", message: "Return to main room • New assignments in 5 minutes" },
  { phase: "rotation-two", time: "6:05", label: "Rotation two", message: "Rotation 2 • Join your assigned breakout room" },
  { phase: "intermission", time: "6:25", label: "Score check", message: "Main room • Short break and score check" },
  { phase: "jeopardy", time: "6:35", label: "Bible Jeopardy", message: "Main event • Bible Jeopardy" },
  { phase: "closing", time: "7:20", label: "Winners + close", message: "Winners, announcements, and closing prayer" },
];

export default function HostOverview() {
  const { state, dispatch, clearParticipants } = useGame();
  const [clearText, setClearText] = useState("");
  const [clearBusy, setClearBusy] = useState(false);
  const [clearMessage, setClearMessage] = useState<string>();

  async function clearTestParticipants() {
    setClearBusy(true); setClearMessage(undefined);
    try {
      const cleared = await clearParticipants(clearText, state.players.length);
      setClearText(""); setClearMessage(`${cleared} participant${cleared === 1 ? "" : "s"} cleared. Teams, scores, rooms, and questions were kept.`);
    } catch (error) {
      setClearMessage(error instanceof Error ? error.message : "Participants could not be cleared.");
    } finally { setClearBusy(false); }
  }

  function setPhase(item: (typeof phases)[number]) {
    dispatch({ type: "set-phase", phase: item.phase, message: item.message, at: timestamp() });
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className="eyebrow">Game Master console</p>
          <h1>Run the whole night<br />from one place.</h1>
        </div>
        <div className={styles.headerActions}>
          <span className="status-pill status-live"><Radio size={13} /> Event live</span>
          <Link className="button button-dark" href="/host/jeopardy">Open Jeopardy <ArrowRight size={18} /></Link>
        </div>
      </header>

      <section className={styles.nowBanner}>
        <div className={styles.nowIcon}><Gamepad2 aria-hidden /></div>
        <div>
          <span>Participant screens currently show</span>
          <strong>{state.activeRoomMessage}</strong>
        </div>
        <Link href="/display" target="_blank">View shared display <ArrowRight size={16} /></Link>
      </section>

      <ScoreStrip state={state} />

      <div className={styles.dashboardGrid}>
        <section className={`card ${styles.timeline}`}>
          <div className={styles.cardHeading}>
            <div><p className="eyebrow">Run of show</p><h2>Event timeline</h2></div>
            <Clock3 aria-hidden />
          </div>
          <div className={styles.phaseList}>
            {phases.map((item) => {
              const active = state.phase === item.phase;
              return (
                <button className={active ? styles.activePhase : undefined} onClick={() => setPhase(item)} type="button" key={item.phase}>
                  <time>{item.time}</time>
                  <span><strong>{item.label}</strong><small>{active ? "Live now on every screen" : "Tap to make live"}</small></span>
                  {active ? <CheckCircle2 aria-label="Current phase" /> : <ArrowRight aria-hidden />}
                </button>
              );
            })}
          </div>
        </section>

        <section className={`card ${styles.rooms}`}>
          <div className={styles.cardHeading}>
            <div><p className="eyebrow">Breakout rooms</p><h2>Temporary codes</h2></div>
            <UsersRound aria-hidden />
          </div>
          <div className={styles.roomList}>
            {state.breakoutRooms.map((room) => (
              <article key={room.id}>
                <div><span>{room.game === "imposter" ? "Find the Imposter" : "Gartic Phone"}</span><strong>{room.name}</strong><small>{room.hostName}</small></div>
                <button type="button" title={`Copy ${room.code}`} onClick={() => navigator.clipboard?.writeText(room.code)}><b>{room.code}</b><Copy size={16} /></button>
              </article>
            ))}
          </div>
          <Link className="button button-ghost" href="/host/room">Manage rooms and hosts <ArrowRight size={17} /></Link>
        </section>

        <section className={`card ${styles.attendance}`}>
          <div className={styles.cardHeading}>
            <div><p className="eyebrow">Check-in</p><h2>{state.players.length} participants</h2></div>
            <Church aria-hidden />
          </div>
          {state.players.length ? (
            <div className={styles.attendanceList}>
              {state.players.map((player) => (
                <article key={player.id}>
                  <span className={player.connected ? styles.onlineDot : styles.awayDot} aria-label={player.connected ? "Recently active" : "Not recently active"} />
                  <div><strong>{player.name}</strong><small>{player.church}</small></div>
                  <b>{state.teams.find((team) => team.id === player.teamId)?.shortName ?? player.teamId}</b>
                </article>
              ))}
            </div>
          ) : <p className={styles.emptyAttendance}>No participants have joined yet.</p>}
          <details className={styles.clearPanel}>
            <summary><Trash2 size={15} /> Clear test participants</summary>
            <p>Available only in the Lobby. This removes participant sessions and room joins, but keeps scores, rooms, and both Jeopardy rounds.</p>
            <label>Type <strong>CLEAR PARTICIPANTS</strong><input disabled={state.phase !== "lobby" || clearBusy} onChange={(event) => setClearText(event.target.value)} value={clearText} /></label>
            <button className="button button-danger" disabled={state.phase !== "lobby" || clearBusy || clearText !== "CLEAR PARTICIPANTS" || state.players.length === 0} onClick={clearTestParticipants} type="button">{clearBusy ? "Clearing…" : `Clear ${state.players.length} participants`}</button>
            {state.phase !== "lobby" ? <small>Return the event timeline to Lobby to unlock this safety action.</small> : null}
            {clearMessage ? <small role="status">{clearMessage}</small> : null}
          </details>
        </section>
      </div>
    </div>
  );
}
