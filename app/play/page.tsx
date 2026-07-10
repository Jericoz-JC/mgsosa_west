"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Radio, Users, Wifi, Zap } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { useGame } from "@/components/game/game-provider";
import { getTeamScore } from "@/lib/game/engine";
import { timestamp } from "@/lib/game/time";
import type { TeamId } from "@/lib/game/types";
import styles from "./play.module.css";

interface StoredPlayer {
  name: string;
  church: string;
  playerId: string;
  teamId: TeamId;
  rotationGroup: string;
}

export default function PlayerPage() {
  const { state, dispatch, identity, mode } = useGame();
  const [stored, setStored] = useState<StoredPlayer>({
    name: "Maya",
    church: "St. Mary’s",
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

  const team = state.teams.find((candidate) => candidate.id === player.teamId) ?? state.teams[0];
  const winner = state.players.find((candidate) => candidate.id === state.buzzWindow?.winnerPlayerId);
  const isMyBuzz = winner?.id === player.playerId;
  const myTeamLocked = state.buzzWindow?.lockedTeamIds.includes(player.teamId) ?? false;
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
          <h1>Connecting…</h1>
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
    <main className={`page-shell ${styles.playerPage}`} style={{ "--team-color": team.color, "--team-accent": team.accent } as React.CSSProperties}>
      <header className={`container topbar ${styles.header}`}>
        <BrandLockup />
        <div className={styles.connection}><Wifi size={16} aria-hidden /> Connected</div>
      </header>

      <div className={`container ${styles.playerGrid}`}>
        <section className={styles.identityPanel}>
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>{player.name}</h1>
            <p>{player.church} • Rotation {player.rotationGroup}</p>
          </div>
          <div className={styles.teamCard}>
            <span>Your team</span>
            <strong>{team.name}</strong>
            <b>{getTeamScore(state, team.id)} pts</b>
          </div>
        </section>

        <section className={styles.liveCard} aria-live="polite">
          <div className={styles.liveHeader}>
            <span className="status-pill status-live"><Radio size={14} /> Live now</span>
            <p>{state.activeRoomMessage}</p>
          </div>

          <div className={`${styles.buzzerStage} ${styles[`state-${buzzState}`]}`}>
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
                <h2>You’re first!</h2>
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
        </section>

        <aside className={styles.nextCard}>
          <div>
            <span>Next up</span>
            <h2>Closing + winners</h2>
            <p>Stay in the main Zoom room after Jeopardy.</p>
          </div>
          <Link className="button button-ghost" href="https://docs.google.com/forms/d/1Q8AQwIE6hgDy6nSb5RqD4arkExgOSmRPbDzK6LAEs1w/viewform" target="_blank">
            August interest form <ExternalLink size={16} />
          </Link>
        </aside>
      </div>
    </main>
  );
}
