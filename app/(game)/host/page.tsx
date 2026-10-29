"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Church, Clock3, Copy, Gamepad2, Radio, Trash2, Undo2, UsersRound } from "lucide-react";
import { useGame } from "@/components/game/game-provider";
import { ScoreStrip } from "@/components/game/score-strip";
import { getGameEventConfig } from "@/lib/game/event-config";
import { gameName } from "@/lib/games/registry";
import { timestamp } from "@/lib/game/time";
import styles from "./host.module.css";


export default function HostOverview() {
  const { state, dispatch, clearParticipants } = useGame();
  const eventConfig = getGameEventConfig(state.eventCode);
  const phases = eventConfig.runOfShow;
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

  function adjust(teamId: (typeof state.teams)[number]["id"], delta: number) {
    dispatch({ type: "adjust-score", teamId, delta, reason: "Game Master correction", at: timestamp() });
  }

  function setPhase(item: (typeof phases)[number]) {
    dispatch({ type: "set-phase", phase: item.phase, message: item.message, at: timestamp() });
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <p className="eyebrow">Game Master console • {eventConfig.title}</p>
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

      <details className={`card ${styles.scoreFix}`}>
        <summary><Undo2 size={15} aria-hidden /> Score corrections</summary>
        <p>Fix a mistaken award. Every change is added to the score ledger.</p>
        <div className={styles.scoreFixGrid}>
          {state.teams.map((team) => (
            <div key={team.id} style={{ "--team-color": team.color } as React.CSSProperties}>
              <strong>{team.shortName}</strong>
              <button className="button button-ghost" onClick={() => adjust(team.id, -100)} type="button" aria-label={`Subtract 100 from ${team.name}`}>−100</button>
              <button className="button button-ghost" onClick={() => adjust(team.id, 100)} type="button" aria-label={`Add 100 to ${team.name}`}>+100</button>
            </div>
          ))}
        </div>
        <button className="button button-ghost" disabled={!state.scoreLedger.length} onClick={() => dispatch({ type: "undo-score" })} type="button"><Undo2 size={16} aria-hidden /> Undo last score change</button>
      </details>

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
                <button aria-current={active ? "step" : undefined} className={active ? styles.activePhase : undefined} disabled={active} onClick={() => setPhase(item)} type="button" key={item.phase}>
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
                <div><span>{gameName(room.game)}</span><strong>{room.name}</strong><small className={room.hasActiveHostGrant ? styles.hostReady : styles.hostNeeded}>{room.hasActiveHostGrant ? "Host link active" : "Host link not sent"}</small></div>
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
