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
import { breakoutGames, gameName, getGame, type HostStage } from "@/lib/games/registry";
import { generateUniqueRoomCode } from "@/lib/game/room-codes";
import styles from "@/app/(game)/host/room/room.module.css";

type ConsoleScope = "host" | "volunteer";

const FALLBACK_STAGES: HostStage[] = [
  { id: "lobby", title: "Room lobby", instruction: "Confirm names and explain the rules.", seconds: 0 },
  { id: "results", title: "Score the round", instruction: "Submit the winning team points.", seconds: 0 },
];

function RoomAdminConsoleContent({ scope = "host" }: { scope?: ConsoleScope }) {
  const {
    state,
    mode,
    roomHostView,
    setRoomCode,
    awardRoomResult,
    issueRoomHostLink,
    revokeRoomHostLink,
    createRoom,
    setRoomCapacity,
  } = useGame();
  const volunteer = scope === "volunteer";
  const activeRotation = state.phase === "rotation-one" || state.phase === "rotation-two";
  const sourceRooms = volunteer && roomHostView ? [roomHostView.room] : state.breakoutRooms;
  const rooms = sourceRooms;
  const [selectedId, setSelectedId] = useState(rooms[0]?.id);
  const [stageIndex, setStageIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [codeBusy, setCodeBusy] = useState(false);
  const [awardBusy, setAwardBusy] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkError, setLinkError] = useState<string>();
  const [latestLink, setLatestLink] = useState<{ roomId: string; value: string }>();
  const [linkCopyStatus, setLinkCopyStatus] = useState<"copied" | "ready">("ready");
  const [codeCopyMessage, setCodeCopyMessage] = useState<string>();
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomGame, setNewRoomGame] = useState(breakoutGames[0].id);
  const [roomBusy, setRoomBusy] = useState(false);
  const [roomError, setRoomError] = useState<string>();
  const room = rooms.find((candidate) => candidate.id === selectedId) ?? rooms[0];
  const game = room ? getGame(room.game) : undefined;
  const stages = game?.hostStages?.length ? game.hostStages : FALLBACK_STAGES;
  const copy = stages[Math.min(stageIndex, stages.length - 1)];
  const nextStage = stages[stageIndex + 1];
  const isResultsStage = stageIndex >= stages.length - 1;
  const roster = useMemo(
    () => volunteer && roomHostView
      ? roomHostView.members
      : state.players.slice(0, 4),
    [roomHostView, state.players, volunteer],
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
    if (!nextStage) return;
    setStageIndex(stageIndex + 1);
    setSeconds(nextStage.seconds);
    setRunning(nextStage.seconds > 0);
  }

  function resetRound() {
    setStageIndex(0);
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

  async function addRoom() {
    if (roomBusy || newRoomName.trim().length < 3) return;
    setRoomBusy(true); setRoomError(undefined);
    try {
      await createRoom({ name: newRoomName, game: newRoomGame, capacity: 12, rotationGroups: ["A", "B", "C", "D"] });
      setNewRoomName(""); setShowAddRoom(false);
    } catch (error) { setRoomError(error instanceof Error ? error.message : "Room could not be added."); }
    finally { setRoomBusy(false); }
  }

  async function changeCapacity(value: number) {
    if (!room || roomBusy) return;
    setRoomBusy(true); setRoomError(undefined);
    try { await setRoomCapacity(room.id, value); }
    catch (error) { setRoomError(error instanceof Error ? error.message : "Room size could not be changed."); }
    finally { setRoomBusy(false); }
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

      {!volunteer ? <section className={styles.roomGuide}>
        <div><strong>1. Choose how many parallel rooms you need.</strong><span>Keep each room near 8–12 people. Four rooms handle up to 48 smoothly.</span></div>
        <div><strong>2. Give each Zoom room its matching code.</strong><span>The code is a door key; it does not move anyone in Zoom.</span></div>
        <div><strong>3. Send each volunteer one private link.</strong><span>They see only their room, live roster, timer, and scoring.</span></div>
        <button className="button button-dark" disabled={rooms.length >= 8} onClick={() => setShowAddRoom((value) => !value)} type="button">{showAddRoom ? "Cancel" : "+ Add breakout room"}</button>
        {showAddRoom ? <div className={styles.addRoomForm}>
          <input aria-label="New room name" onChange={(event) => setNewRoomName(event.target.value)} placeholder="Example: Imposter • Phoenix" value={newRoomName} />
          <select aria-label="Game" onChange={(event) => setNewRoomGame(event.target.value)} value={newRoomGame}>{breakoutGames.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
          <button className="button button-gold" disabled={roomBusy || newRoomName.trim().length < 3} onClick={addRoom} type="button">{roomBusy ? "Adding…" : "Create room for 12"}</button>
        </div> : null}
        {roomError ? <p className="form-error" role="alert">{roomError}</p> : null}
      </section> : null}

      {!volunteer && rooms.length > 1 ? (
        <section className={styles.roomPicker} aria-label="Choose a room to manage">
          {rooms.map((candidate) => (
            <button aria-pressed={candidate.id === room.id} className={candidate.id === room.id ? styles.selectedRoom : undefined} onClick={() => { setSelectedId(candidate.id); setCodeCopyMessage(undefined); setLinkError(undefined); resetRound(); }} type="button" key={candidate.id}>
              <span>{gameName(candidate.game)}</span>
              <strong>{candidate.name}</strong>
              <small>{candidate.code || "Code not loaded"}</small>
            </button>
          ))}
        </section>
      ) : null}

      <div className={styles.consoleGrid}>
        <section className={styles.runConsole}>
          <div className={styles.roomBar}>
            <div><span>{gameName(room.game)}</span><strong>{room.name}</strong></div>
            <div className={styles.codeBox}>
              <small>Participant code</small>
              <b>{room.code || "—"}</b>
              <button onClick={copyParticipantCode} type="button" aria-label="Copy participant room code"><Copy size={16} /></button>
              {codeCopyMessage ? <em className={styles.copyFeedback} role="status">{codeCopyMessage}</em> : null}
            </div>
            <label className={styles.capacityControl}>Room size
              <select disabled={volunteer || roomBusy} onChange={(event) => changeCapacity(Number(event.target.value))} value={room.capacity}>
                {[8, 10, 12, 14, 16].map((size) => <option key={size} value={size}>{room.memberCount ?? roster.length}/{size} joined</option>)}
              </select>
            </label>
          </div>

          <div className={styles.stageHero}>
            <span className="status-pill status-live">Step {stageIndex + 1} of {stages.length}</span>
            <h2>{copy.title}</h2>
            <p>{copy.instruction}</p>
            <ol className={styles.stageTrack} aria-label="Round steps">
              {stages.map((item, index) => (
                <li aria-current={index === stageIndex ? "step" : undefined} className={index < stageIndex ? styles.stageDone : index === stageIndex ? styles.stageCurrent : undefined} key={item.id}>{item.title}</li>
              ))}
            </ol>

            {copy.seconds > 0 ? (
              <div className={styles.timer}>
                <Clock3 aria-hidden />
                <strong>{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</strong>
                <button onClick={() => setRunning((value) => !value)} type="button">{running ? "Pause" : "Resume"}</button>
              </div>
            ) : null}

            <div className={styles.primaryActions}>
              {copy.externalTool ? <a className="button button-gold" href={copy.externalTool.url} target="_blank" rel="noreferrer"><Link2 size={18} /> {copy.externalTool.label}</a> : null}
              {nextStage ? (
                <button className={copy.externalTool ? "button button-ghost" : "button button-gold"} onClick={advance} type="button">
                  {nextStage.id === "results" ? <Vote size={17} /> : <Play size={18} />} Start {nextStage.title}
                </button>
              ) : null}
              <button className="button button-ghost" onClick={resetRound} type="button"><RotateCcw size={17} /> Reset round</button>
            </div>
          </div>
        </section>

        <aside className={styles.sideRail}>
          <section className="card">
            <div className={styles.sideHeading}><div><p className="eyebrow">Participants</p><h2>Room entry</h2></div><RefreshCw aria-hidden /></div>
            <p>Share this temporary code only in the matching Zoom breakout room. Participants enter it on their phone after the Game Master starts a rotation. Replacing it stops new joins with the old code.</p>
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

          {isResultsStage && !activeRotation ? (
            <section className="card">
              <div className={styles.sideHeading}><div><p className="eyebrow">Round result</p><h2>Scoring opens in a rotation</h2></div><Vote aria-hidden /></div>
              <p>Points can be submitted once the Game Master starts Rotation one or Rotation two.</p>
            </section>
          ) : null}

          {game?.hostPrompts ? (
            <details className={`card ${styles.promptCard}`}>
              <summary><span><small>Host only • never screen share</small><strong>{game.hostPrompts.label}</strong></span></summary>
              <ul>{game.hostPrompts.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </details>
          ) : null}

          {isResultsStage && activeRotation ? (
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
