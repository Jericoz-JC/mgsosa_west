"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Radio, Users, Wifi, Zap } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { useDemoGame } from "@/components/game/demo-game-provider";
import { getTeamScore } from "@/lib/game/engine";
import { timestamp } from "@/lib/game/time";
import styles from "./play.module.css";

interface StoredPlayer {
  name: string;
  church: string;
  playerId: string;
  teamId: "pacific";
  rotationGroup: string;
}

export default function PlayerPage() {
  const { state, dispatch } = useDemoGame();
  const [player, setPlayer] = useState<StoredPlayer>({
    name: "Maya",
    church: "St. Mary’s",
    playerId: "player-maya",
    teamId: "pacific",
    rotationGroup: "A",
  });

  useEffect(() => {
    const stored = window.localStorage.getItem("mgsosa-west-player");
    if (stored) queueMicrotask(() => setPlayer(JSON.parse(stored) as StoredPlayer));
  }, []);

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
