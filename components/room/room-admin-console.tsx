"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Copy,
  Link2,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  UsersRound,
  Vote,
} from "lucide-react";
import { useGame } from "@/components/game/game-provider";
import { generateUniqueRoomCode } from "@/lib/game/room-codes";
import styles from "@/app/host/room/room.module.css";

type Stage = "lobby" | "clues" | "discussion" | "vote" | "results";
type ConsoleScope = "host" | "volunteer";

const stageCopy: Record<Stage, { title: string; instruction: string; seconds: number; next?: Stage }> = {
  lobby: { title: "Room lobby", instruction: "Confirm names, explain the rules, and make sure nobody is screen sharing.", seconds: 0, next: "clues" },
  clues: { title: "Clue rounds", instruction: "Follow the speaking order. Each person gives one word only.", seconds: 180, next: "discussion" },
  discussion: { title: "Open discussion", instruction: "Everyone may discuss who they think the Imposter is.", seconds: 60, next: "vote" },
  vote: { title: "Simultaneous vote", instruction: "Count down 3–2–1, then everyone submits together.", seconds: 20, next: "results" },
  results: { title: "Reveal + score", instruction: "Reveal the Imposter and submit the winning team points.", seconds: 0 },
};

function RoomAdminConsoleContent({ scope = "host" }: { scope?: ConsoleScope }) {
  const {
    state,
    mode,
    roomHostView,
    setRoomCode,
    awardRoomResult,
    issueRoomHostLink,
    revokeRoomHostLink,
  } = useGame();
  const volunteer = scope === "volunteer";
  const activeRotation = state.phase === "rotation-one" || state.phase === "rotation-two";
  const sourceRooms = volunteer && roomHostView ? [roomHostView.room] : state.breakoutRooms;
  const rooms = sourceRooms;
  const [selectedId, setSelectedId] = useState(rooms[0]?.id);
  const [stage, setStage] = useState<Stage>("lobby");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [codeBusy, setCodeBusy] = useState(false);
  const [awardBusy, setAwardBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string>();
  const [latestLink, setLatestLink] = useState<{ roomId: string; value: string }>();
  const [linkCopyStatus, setLinkCopyStatus] = useState<"copied" | "ready">("ready");
  const [codeCopyMessage, setCodeCopyMessage] = useState<string>();
  const room = rooms.find((candidate) => candidate.id === selectedId) ?? rooms[0];
  const copy = stageCopy[stage];
  const roster = useMemo(
    () => volunteer && roomHostView
      ? roomHostView.members
      : state.players.slice(0, room?.game === "imposter" ? 4 : 3),
    [roomHostView, room?.game, state.players, volunteer],
  );
  const awardKey = room && activeRotation ? `room-award:${room.id}:${state.phaseStartedAt}` : undefined;
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

  async function regenerate() {
    if (!room || codeBusy) return;
    const code = generateUniqueRoomCode(rooms.map((candidate) => candidate.code));
    setCodeBusy(true);
    try {
      await setRoomCode(room.id, code);
      setCodeCopyMessage(undefined);
    } catch {
      // The shared provider displays the actionable error toast.
    } finally {
      setCodeBusy(false);
    }
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

  async function award(teamId: (typeof state.teams)[number]["id"]) {
    if (!room || !activeRotation || !awardKey || awardedEvent || awardBusy) return;
    setAwardBusy(true);
    try {
      await awardRoomResult(room.id, teamId, `${room.name} round winner`, awardKey);
    } catch {
      // The shared provider displays the actionable error toast.
    } finally {
      setAwardBusy(false);
    }
  }

  async function createVolunteerLink() {
    if (!room || linkBusy) return;
    setLinkBusy(true);
    setLinkError(undefined);
    try {
      const value = await issueRoomHostLink(room.id);
      setLatestLink({ roomId: room.id, value });
      setLinkCopyStatus(await copyText(value) ? "copied" : "ready");
    } catch {
      setLinkError("The private link could not be created. Check the connection and try again.");
    } finally {
      setLinkBusy(false);
    }
  }

  async function copyText(value: string) {
    if (!navigator.clipboard) return false;
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  async function copyParticipantCode() {
    if (!room) return;
    const copied = await copyText(room.code);
    setCodeCopyMessage(copied ? "Copied" : "Select the visible code to copy it");
  }

  async function copyLatestVolunteerLink() {
    if (!latestLink) return;
    setLinkCopyStatus(await copyText(latestLink.value) ? "copied" : "ready");
  }

  async function revokeVolunteerLink() {
    if (!room || linkBusy) return;
    setLinkBusy(true);
    setLinkError(undefined);
    try {
      await revokeRoomHostLink(room.id);
      setLatestLink(undefined);
    } catch {
      setLinkError("The private link could not be revoked. Try again.");
    } finally {
      setLinkBusy(false);
    }
  }

  if (!room) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className="eyebrow">{volunteer ? "Your room console" : "Game Master • breakout rooms"}</p>
          <h1>{volunteer ? <>One room.<br />One clear job.</> : <>Prepare every<br />room in one place.</>}</h1>
        </div>
        <p>{volunteer
          ? "Run the assigned activity, keep momentum, and submit the result. The Game Master handles everything else."
          : "Create participant codes, send each volunteer a private link, and keep room access separate from Game Master controls."}</p>
      </header>

      {!volunteer && rooms.length > 1 ? (
        <section className={styles.roomPicker} aria-label="Choose a room to manage">
          {rooms.map((candidate) => (
            <button aria-pressed={candidate.id === room.id} className={candidate.id === room.id ? styles.selectedRoom : undefined} onClick={() => { setSelectedId(candidate.id); setCodeCopyMessage(undefined); setLinkError(undefined); resetRound(); }} type="button" key={candidate.id}>
              <span>{candidate.game === "imposter" ? "Find the Imposter" : "Gartic Phone"}</span>
              <strong>{candidate.name}</strong>
              <small>{candidate.code || "Code not loaded"}</small>
            </button>
          ))}
        </section>
      ) : null}

      <div className={styles.consoleGrid}>
        <section className={styles.runConsole}>
          <div className={styles.roomBar}>
            <div><span>{room.game === "imposter" ? "Find the Imposter" : "Gartic Phone"}</span><strong>{room.name}</strong></div>
            <div className={styles.codeBox}>
              <small>Participant code</small>
              <b>{room.code || "—"}</b>
              <button onClick={copyParticipantCode} type="button" aria-label="Copy participant room code"><Copy size={16} /></button>
              {codeCopyMessage ? <em className={styles.copyFeedback} role="status">{codeCopyMessage}</em> : null}
            </div>
          </div>

          <div className={styles.stageHero}>
            <span className="status-pill status-live">Current step</span>
            <h2>{room.game === "gartic" ? (stage === "results" ? "Choose the favorite" : "Open the Gartic room") : copy.title}</h2>
            <p>{room.game === "gartic"
              ? (stage === "results" ? "Ask everyone to vote in Zoom chat, then award the favorite album." : "Create the Gartic room, paste its link into Zoom chat, and confirm every nickname includes first name + church.")
              : copy.instruction}</p>

            {room.game === "imposter" && copy.seconds > 0 ? (
              <div className={styles.timer}>
                <Clock3 aria-hidden />
                <strong>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</strong>
                <button onClick={() => setRunning((value) => !value)} type="button">{running ? "Pause" : "Resume"}</button>
              </div>
            ) : null}

            <div className={styles.primaryActions}>
              {room.game === "imposter" && copy.next ? <button className="button button-gold" onClick={advance} type="button"><Play size={18} /> Start {stageCopy[copy.next].title}</button> : null}
              {room.game === "gartic" && stage !== "results" ? (
                <>
                  <a className="button button-gold" href="https://garticphone.com" target="_blank" rel="noreferrer"><Link2 size={18} /> Open Gartic Phone</a>
                  <button className="button button-ghost" onClick={() => setStage("results")} type="button"><Vote size={17} /> Finish reveal + vote</button>
                </>
              ) : null}
              <button className="button button-ghost" onClick={resetRound} type="button"><RotateCcw size={17} /> Reset round</button>
            </div>
          </div>
        </section>

        <aside className={styles.sideRail}>
          <section className="card">
            <div className={styles.sideHeading}><div><p className="eyebrow">Participants</p><h2>Room entry</h2></div><RefreshCw aria-hidden /></div>
            <p>Share this temporary code only in the matching Zoom breakout room. Replacing it stops new joins with the old code.</p>
            <button className="button button-ghost" disabled={codeBusy} onClick={regenerate} type="button"><RefreshCw size={16} /> {codeBusy ? "Generating…" : "Generate new code"}</button>
          </section>

          {!volunteer && mode === "convex" ? (
            <section className={`card ${styles.hostLinkCard}`}>
              <div className={styles.sideHeading}><div><p className="eyebrow">Volunteer access</p><h2>Private host link</h2></div><ShieldCheck aria-hidden /></div>
              <p>The link opens only {room.name}. Creating a replacement immediately invalidates the old one.</p>
              <button className="button button-dark" disabled={linkBusy} onClick={createVolunteerLink} type="button">
                <Link2 size={16} /> {linkBusy ? "Working…" : room.hasActiveHostGrant ? "Replace + copy link" : "Create + copy link"}
              </button>
              {room.hasActiveHostGrant ? <button className={styles.revokeLink} disabled={linkBusy} onClick={revokeVolunteerLink} type="button"><ShieldOff size={15} /> Revoke current link</button> : null}
              {latestLink?.roomId === room.id ? (
                <div className={styles.linkReceipt} role="status">
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>{linkCopyStatus === "copied" ? "Copied" : "Private link ready"}</strong>
                    <small>{linkCopyStatus === "copied" ? "Paste it directly to this room’s volunteer." : "Select the link below and copy it manually."}</small>
                  </span>
                  <button onClick={copyLatestVolunteerLink} type="button" aria-label="Copy private volunteer link again"><Copy size={15} /></button>
                  <input aria-label="Private volunteer link" onFocus={(event) => event.currentTarget.select()} readOnly value={latestLink.value} />
                </div>
              ) : null}
              {linkError ? <p className="form-error" role="alert">{linkError}</p> : null}
            </section>
          ) : null}

          <section className="card">
            <div className={styles.sideHeading}><div><p className="eyebrow">{volunteer ? "Live attendance" : mode === "convex" ? "Attendance" : "Demo roster"}</p><h2>{volunteer ? `${roster.length} joined` : mode === "convex" ? "Use Zoom roster" : `${roster.length} players`}</h2></div><UsersRound aria-hidden /></div>
            {volunteer ? (
              roster.length ? <ul>{roster.map((player, index) => <li key={player.id}><b>{index + 1}</b><span><strong>{player.name}</strong><small>{player.church}</small></span><CheckCircle2 size={17} /></li>)}</ul> : <p>No participants have entered this room code yet.</p>
            ) : mode === "convex" ? <p>Zoom controls the live breakout membership. Open the volunteer link to see who joined through the web code.</p> : (
              <ul>{roster.map((player, index) => <li key={player.id}><b>{index + 1}</b><span><strong>{player.name}</strong><small>{player.church}</small></span><CheckCircle2 size={17} /></li>)}</ul>
            )}
          </section>

          {stage === "results" && activeRotation ? (
            <section className={`card ${styles.resultsCard}`}>
              <div className={styles.sideHeading}><div><p className="eyebrow">Round result</p><h2>{awardedEvent ? "Score submitted" : "Award 200"}</h2></div><Vote aria-hidden /></div>
              {awardedEvent ? <p role="status">This room’s result for the current rotation is already recorded.</p> : <p>Select the winning team once. Duplicate submissions are blocked.</p>}
              <div className={styles.teamButtons}>{state.teams.map((team) => <button disabled={Boolean(awardedEvent) || awardBusy} style={{ "--team-color": team.color } as React.CSSProperties} onClick={() => award(team.id)} type="button" key={team.id}>{team.shortName}</button>)}</div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export function RoomAdminConsole({ scope = "host" }: { scope?: ConsoleScope }) {
  const { state } = useGame();
  return <RoomAdminConsoleContent key={state.phaseStartedAt} scope={scope} />;
}
