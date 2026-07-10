"use client";

import Image from "next/image";
import { Radio, Trophy } from "lucide-react";
import { JeopardyBoard } from "@/components/game/jeopardy-board";
import { useDemoGame } from "@/components/game/demo-game-provider";
import { getCurrentQuestion, getTeamScore } from "@/lib/game/engine";
import styles from "./display.module.css";

export default function DisplayPage() {
  const { state } = useDemoGame();
  const question = getCurrentQuestion(state);
  const winner = state.players.find((player) => player.id === state.buzzWindow?.winnerPlayerId);
  const winnerTeam = state.teams.find((team) => team.id === winner?.teamId);
  const ranking = [...state.teams].sort((a, b) => getTeamScore(state, b.id) - getTeamScore(state, a.id));

  return (
    <main className={styles.display}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Image src="/brand/mgsosa-mark-transparent.png" alt="MGSOSA" width={74} height={74} priority />
          <div><strong>MGSOSA West</strong><span>Game Night • Bible Jeopardy</span></div>
        </div>
        <div className={styles.joinCode}><span>Join with code</span><strong>{state.eventCode}</strong></div>
      </header>

      <section className={styles.stage}>
        {question ? (
          <div className={styles.questionStage}>
            <div className={styles.questionMeta}><span>{question.category}</span><strong>${question.value}</strong></div>
            <h1>{question.clue}</h1>
            <div className={styles.publicStatus} data-status={state.buzzWindow?.status}>
              <Radio aria-hidden />
              {state.buzzWindow?.status === "open" ? <strong>Buzz now</strong> : null}
              {state.buzzWindow?.status === "claimed" ? <strong>{winner?.name} • {winnerTeam?.name}</strong> : null}
              {state.buzzWindow?.status === "locked" ? <strong>Buzzers locked</strong> : null}
            </div>
          </div>
        ) : (
          <div className={styles.boardStage}>
            <p className="eyebrow">Choose a category</p>
            <JeopardyBoard state={state} displayOnly />
          </div>
        )}
      </section>

      <footer className={styles.leaderboard}>
        <div className={styles.leaderTitle}><Trophy aria-hidden /><span>Live scores</span></div>
        {ranking.map((team, index) => (
          <div className={styles.leaderTeam} style={{ "--team-color": team.color } as React.CSSProperties} key={team.id}>
            <span>{index + 1}</span><strong>{team.shortName}</strong><b>{getTeamScore(state, team.id)}</b>
          </div>
        ))}
      </footer>
    </main>
  );
}
