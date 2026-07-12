"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Radio, Users, Wifi, Zap } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { useGame } from "@/components/game/game-provider";
import { ParticipantRoomCard } from "@/components/room/participant-room-card";
import { getTeamScore } from "@/lib/game/engine";
import { timestamp } from "@/lib/game/time";
import type { EventPhase, TeamId } from "@/lib/game/types";
import styles from "./play.module.css";

interface StoredPlayer {
  name: string;
  church: string;
  playerId: string;
  teamId: TeamId;
  rotationGroup: string;
}

const nextCopy: Record<EventPhase, { eyebrow: string; title: string; detail: string }> = {
  lobby: { eyebrow: "Next up", title: "Breakout rooms", detail: "Your room host will share a temporary code in Zoom." },
  "rotation-one": { eyebrow: "After this round", title: "Return to main Zoom", detail: "The Game Master will call everyone back before the switch." },
  switching: { eyebrow: "Next up", title: "Rotation two", detail: "A new temporary room code will be shared after the switch." },
  "rotation-two": { eyebrow: "After this round", title: "Score check", detail: "Return to the main Zoom room when your host wraps up." },
  intermission: { eyebrow: "Next up", title: "Bible Jeopardy", detail: "Stay in the main Zoom room and keep this page open." },
  jeopardy: { eyebrow: "Next up", title: "Closing + winners", detail: "Stay in the main Zoom room after the final clue." },
  closing: { eyebrow: "Game night", title: "Thank you, West", detail: "Stay for announcements and the closing prayer." },
};

function standbyCopy(phase: EventPhase) {
  switch (phase) {
    case "lobby":
      return { label: "Event lobby", title: "You're checked in", detail: "Stay in the main Zoom room. The Game Master will announce when breakout rooms open." };
    case "switching":
      return { label: "Room switch", title: "Back to the main room", detail: "Room hosts are resetting. Your next temporary code will be shared in a few minutes." };
    case "intermission":
      return { label: "Short intermission", title: "Scores are being checked", detail: "Take a quick break, stay in the main Zoom room, and come back ready for Bible Jeopardy." };
    case "closing":
      return { label: "Final gathering", title: "Winners + closing", detail: "Keep Zoom open for the winners, announcements, and closing prayer." };
    default:
      return { label: "Game night", title: "Stay ready", detail: "Follow the live instructions from the Game Master in Zoom." };
  }
}

export default function PlayerPage() {
  const { state, dispatch, identity, mode, currentRoom, joinRoom } = useGame();
  const [stored, setStored] = useState<StoredPlayer>({
    name: "Maya",
    church: "St. Mary's",
    playerId: "player-maya",
    teamId: "pacific",
    rotationGroup: "A",
  });

  useEffect(() => {
    const value = window.localStorage.getItem("mgsosa-west-player");
    if (value) queueMicrotask(() => setStored(JSON.parse(value) as StoredPlayer));
  }, []);

  const player: StoredPlayer = identity
    ? {
        name: identity.name,
        church: identity.church,
        playerId: identity.playerId,
        teamId: identity.teamId ?? "pacific",
        rotationGroup: identity.rotationGroup,
      }
    : stored;

  const team = state.teams.find((candidate) => candidate.id === player.teamId);
  const winner = state.players.find((candidate) => candidate.id === state.buzzWindow?.winnerPlayerId);
  const isMyBuzz = winner?.id === player.playerId;
  const myTeamLocked = player.teamId ? state.buzzWindow?.lockedTeamIds.includes(player.teamId) ?? false : false;
  const rotationPhase = state.phase === "rotation-one" || state.phase === "rotation-two" ? state.phase : null;
  const waiting = standbyCopy(state.phase);
  const next = nextCopy[state.phase];
  const buzzState = useMemo(() => {
    if (!state.currentQuestionId) return "standby";
    if (myTeamLocked) return "team-locked";
    if (state.buzzWindow?.status === "open") return "open";
    if (state.buzzWindow?.status === "claimed") return isMyBuzz ? "winner" : "claimed";
    return "locked";
  }, [state.currentQuestionId, state.buzzWindow, myTeamLocked, isMyBuzz]);

  function buzz() {
    dispatch({ type: "buzz", playerId: player.playerId, at: timestamp() });
    if (navigator.vibrate) navigator.vibrate(35);
  }

  // In Convex mode the play surface is only real once this device has a
  // participant record; otherwise the buzzer would look live but be rejected.
  if (mode === "convex" && identity === undefined) {
    return (
      <main className="page-shell" style={{ display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center", padding: "2rem" }}>
        <div>
          <h1>Connecting...</h1>
          <p>Restoring your player session.</p>
        </div>
      </main>
    );
  }
  if (mode === "convex" && identity === null) {
    return (
      <main className="page-shell" style={{ display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center", padding: "2rem" }}>
        <div>
          <h1>Join the event first</h1>
          <p>This device has not joined game night yet.</p>
          <Link className="button button-gold" href="/" style={{ marginTop: "1rem", display: "inline-flex" }}>
            Go to the join page
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={`page-shell ${styles.playerPage}`} style={{ "--team-color": team?.color ?? "#24324a", "--team-accent": team?.accent ?? "#d9e0ea" } as React.CSSProperties}>
      <header className={`container topbar ${styles.header}`}>
        <BrandLockup />
        <div className={styles.connection}><Wifi size={16} aria-hidden /> Connected</div>
      </header>

      <div className={`container ${styles.playerGrid}`}>
        <section className={styles.identityPanel}>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>{player.name}</h1>
            <p>{player.church} &bull; Rotation {player.rotationGroup}</p>
          </div>
          <div className={styles.teamCard}>
            <span>Your team</span>
            <strong>{team?.name ?? "Waiting for assignment"}</strong>
            <b>{team ? `${getTeamScore(state, team.id)} pts` : "The Game Master will announce teams"}</b>
          </div>
        </section>

        <section className={styles.liveCard}>
          <div className={styles.liveHeader}>
            <span className={`status-pill ${state.phase === "jeopardy" || rotationPhase ? "status-live" : "status-waiting"}`}>
              {rotationPhase ? <Users size={14} aria-hidden /> : <Radio size={14} aria-hidden />}
              {rotationPhase ? "Breakout time" : state.phase === "jeopardy" ? "Live now" : "On schedule"}
            </span>
            <p>{state.activeRoomMessage}</p>
          </div>

          {rotationPhase ? (
            <ParticipantRoomCard
              key={`${rotationPhase}:${currentRoom?.id ?? "none"}`}
              currentRoom={currentRoom}
              onJoin={joinRoom}
              phase={rotationPhase}
            />
          ) : state.phase === "jeopardy" && team ? (
            <div className={`${styles.buzzerStage} ${styles[`state-${buzzState}`]}`} aria-live="polite">
              {buzzState === "open" ? (
                <button className={styles.buzzButton} onClick={buzz} type="button">
                  <Zap aria-hidden />
                  <span>Buzz</span>
                  <small>Tap once</small>
                </button>
              ) : null}

              {buzzState === "locked" || buzzState === "standby" ? (
                <div className={styles.buzzMessage}>
                  <span className={styles.lockIcon}><Radio aria-hidden /></span>
                  <h2>{buzzState === "standby" ? "Ready for the next clue" : "Buzzers locked"}</h2>
                  <p>{buzzState === "standby" ? "Watch the shared Zoom screen." : "The host is reading. Your button will turn gold when it opens."}</p>
                </div>
              ) : null}

              {buzzState === "winner" ? (
                <div className={styles.buzzMessage}>
                  <span className={styles.winnerIcon}><Zap aria-hidden /></span>
                  <h2>You&apos;re first!</h2>
                  <p>Your team has 12 seconds to confer. Choose one spokesperson.</p>
                </div>
              ) : null}

              {buzzState === "claimed" ? (
                <div className={styles.buzzMessage}>
                  <span className={styles.claimedIcon}><Users aria-hidden /></span>
                  <h2>{winner?.name ?? "Another player"} buzzed first</h2>
                  <p>{state.teams.find((candidate) => candidate.id === winner?.teamId)?.name} is answering.</p>
                </div>
              ) : null}

              {buzzState === "team-locked" ? (
                <div className={styles.buzzMessage}>
                  <span className={styles.claimedIcon}><Users aria-hidden /></span>
                  <h2>Your team already tried</h2>
                  <p>Stay ready for the next clue.</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.phaseStage} aria-live="polite">
              <div className={styles.phaseCard}>
                <span className={styles.phaseIcon}><Radio aria-hidden /></span>
                <p>{waiting.label}</p>
                <h2>{waiting.title}</h2>
                <div className={styles.phaseRule} aria-hidden />
                <strong>{waiting.detail}</strong>
                <small>Live instructions will update here automatically.</small>
              </div>
            </div>
          )}
        </section>

        <aside className={styles.nextCard}>
          <div>
            <span>{next.eyebrow}</span>
            <h2>{next.title}</h2>
            <p>{next.detail}</p>
          </div>
          <Link className="button button-ghost" href="https://docs.google.com/forms/d/1Q8AQwIE6hgDy6nSb5RqD4arkExgOSmRPbDzK6LAEs1w/viewform" target="_blank">
            August interest form <ExternalLink size={16} />
          </Link>
        </aside>
      </div>
    </main>
  );
}
