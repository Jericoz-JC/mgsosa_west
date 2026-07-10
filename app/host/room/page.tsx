"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Copy, Link2, Play, RefreshCw, RotateCcw, UsersRound, Vote } from "lucide-react";
import { useGame } from "@/components/game/game-provider";
import { generateUniqueRoomCode } from "@/lib/game/room-codes";
import type { BreakoutRoom } from "@/lib/game/types";
import { timestamp } from "@/lib/game/time";
import styles from "./room.module.css";

type Stage = "lobby" | "clues" | "discussion" | "vote" | "results";

const stageCopy: Record<Stage, { title: string; instruction: string; seconds: number; next?: Stage }> = {
  lobby: { title: "Room lobby", instruction: "Confirm names, explain the rules, and make sure nobody is screen sharing.", seconds: 0, next: "clues" },
  clues: { title: "Clue rounds", instruction: "Follow the speaking order. Each person gives one word only.", seconds: 180, next: "discussion" },
  discussion: { title: "Open discussion", instruction: "Everyone may discuss who they think the Imposter is.", seconds: 60, next: "vote" },
  vote: { title: "Simultaneous vote", instruction: "Count down 3–2–1, then everyone submits together.", seconds: 20, next: "results" },
  results: { title: "Reveal + score", instruction: "Reveal the Imposter and submit the winning team points.", seconds: 0 },
};

export default function RoomAdminPage() {
  const { state, dispatch, mode, setRoomCode } = useGame();
  const [localRooms, setLocalRooms] = useState<BreakoutRoom[]>(state.breakoutRooms);
  // In Convex mode room codes live on the server; locally we keep the demo behavior.
  const rooms = mode === "convex" ? state.breakoutRooms : localRooms;
  const [selectedId, setSelectedId] = useState(state.breakoutRooms[0]?.id);
  const [stage, setStage] = useState<Stage>("lobby");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const room = rooms.find((candidate) => candidate.id === selectedId) ?? rooms[0]!;
  const copy = stageCopy[stage];
  const roster = useMemo(() => state.players.slice(0, room?.game === "imposter" ? 4 : 3), [state.players, room?.game]);
  const awardKey = room ? `room-award:${room.id}:${state.phaseStartedAt}` : undefined;
  const awardedEvent = awardKey
    ? state.scoreLedger.find((event) => event.idempotencyKey === awardKey)
    : undefined;

  useEffect(() => {
    if (!running || seconds <= 0) return;
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) {
        setRunning(false);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running, seconds]);

  function regenerate() {
    const code = generateUniqueRoomCode(rooms.map((candidate) => candidate.code));
    if (mode === "convex") {
      void setRoomCode(room.id, code);
      return;
    }
    setLocalRooms((current) => current.map((candidate) => candidate.id === room.id ? { ...candidate, code } : candidate));
  }

  function advance() {
    if (!copy.next) return;
    const next = copy.next;
    setStage(next);
    setSeconds(stageCopy[next].seconds);
    setRunning(stageCopy[next].seconds > 0);
  }

  function resetRound() {
    setStage("lobby");
    setSeconds(0);
    setRunning(false);
  }

  function award(teamId: (typeof state.teams)[number]["id"]) {
    if (!awardKey || awardedEvent) return;
    dispatch({
      type: "adjust-score",
      teamId,
      delta: 200,
      reason: `${room.name} round winner`,
      at: timestamp(),
      idempotencyKey: awardKey,
    });
  }

  if (!room) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><p className="eyebrow">Room admin console</p><h1>One room.<br />One clear job.</h1></div>
        <p>Run the assigned activity, keep momentum, and submit the result. The Game Master handles everything else.</p>
      </header>

      <section className={styles.roomPicker} aria-label="Choose a room to manage">
        {rooms.map((candidate) => (
          <button className={candidate.id === room.id ? styles.selectedRoom : undefined} onClick={() => { setSelectedId(candidate.id); resetRound(); }} type="button" key={candidate.id}>
            <span>{candidate.game === "imposter" ? "Find the Imposter" : "Gartic Phone"}</span>
            <strong>{candidate.name}</strong>
            <small>{candidate.code}</small>
          </button>
        ))}
      </section>

      <div className={styles.consoleGrid}>
        <section className={styles.runConsole}>
          <div className={styles.roomBar}>
            <div><span>{room.game === "imposter" ? "Find the Imposter" : "Gartic Phone"}</span><strong>{room.name}</strong></div>
            <div className={styles.codeBox}><small>Room code</small><b>{room.code}</b><button onClick={() => navigator.clipboard?.writeText(room.code)} type="button" aria-label="Copy room code"><Copy size={16} /></button></div>
          </div>

          <div className={styles.stageHero}>
            <span className="status-pill status-live">Current step</span>
            <h2>{room.game === "gartic" ? "Open the Gartic room" : copy.title}</h2>
            <p>{room.game === "gartic" ? "Create the Gartic room, paste the link into Zoom chat, and confirm every nickname includes first name + church." : copy.instruction}</p>

            {room.game === "imposter" && copy.seconds > 0 ? (
              <div className={styles.timer}>
                <Clock3 aria-hidden />
                <strong>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</strong>
                <button onClick={() => setRunning((value) => !value)} type="button">{running ? "Pause" : "Resume"}</button>
              </div>
            ) : null}

            <div className={styles.primaryActions}>
              {room.game === "imposter" && copy.next ? <button className="button button-gold" onClick={advance} type="button"><Play size={18} /> Start {stageCopy[copy.next].title}</button> : null}
              {room.game === "gartic" ? (
                <a className="button button-gold" href="https://garticphone.com" target="_blank" rel="noreferrer">
                  <Link2 size={18} /> Open Gartic Phone
                </a>
              ) : null}
              <button className="button button-ghost" onClick={resetRound} type="button"><RotateCcw size={17} /> Reset round</button>
            </div>
          </div>
        </section>

        <aside className={styles.sideRail}>
          <section className="card">
            <div className={styles.sideHeading}><div><p className="eyebrow">Temporary access</p><h2>Room entry</h2></div><RefreshCw aria-hidden /></div>
            <p>Codes contain five digits by default and only identify this breakout room.</p>
            <button className="button button-ghost" onClick={regenerate} type="button"><RefreshCw size={16} /> Generate new code</button>
          </section>

          {mode === "convex" ? (
            <section className="card">
              <div className={styles.sideHeading}><div><p className="eyebrow">Attendance</p><h2>Use the Zoom roster</h2></div><UsersRound aria-hidden /></div>
              <p>Zoom controls the live breakout membership. Confirm names there before starting the round.</p>
            </section>
          ) : (
            <section className="card">
              <div className={styles.sideHeading}><div><p className="eyebrow">Demo roster</p><h2>{roster.length} players</h2></div><UsersRound aria-hidden /></div>
              <ul>{roster.map((player, index) => <li key={player.id}><b>{index + 1}</b><span><strong>{player.name}</strong><small>{player.church}</small></span><CheckCircle2 size={17} /></li>)}</ul>
            </section>
          )}

          {stage === "results" ? (
            <section className={`card ${styles.resultsCard}`}>
              <div className={styles.sideHeading}><div><p className="eyebrow">Round result</p><h2>{awardedEvent ? "Score submitted" : "Award 200"}</h2></div><Vote aria-hidden /></div>
              {awardedEvent ? <p role="status">This room’s result for the current rotation is already recorded.</p> : null}
              <div className={styles.teamButtons}>{state.teams.map((team) => <button disabled={Boolean(awardedEvent)} style={{ "--team-color": team.color } as React.CSSProperties} onClick={() => award(team.id)} type="button" key={team.id}>{team.shortName}</button>)}</div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
