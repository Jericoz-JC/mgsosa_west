"use client";

import Link from "next/link";
import { ArrowLeft, Check, CircleStop, Eye, Radio, RotateCcw, Unlock, X } from "lucide-react";
import { JeopardyBoard } from "@/components/game/jeopardy-board";
import { useDemoGame } from "@/components/game/demo-game-provider";
import { ScoreStrip } from "@/components/game/score-strip";
import { getCurrentQuestion } from "@/lib/game/engine";
import { timestamp } from "@/lib/game/time";
import styles from "./jeopardy.module.css";

export default function JeopardyHostPage() {
  const { state, dispatch } = useDemoGame();
  const question = getCurrentQuestion(state);
  const winner = state.players.find((player) => player.id === state.buzzWindow?.winnerPlayerId);
  const winnerTeam = state.teams.find((team) => team.id === winner?.teamId);
  const wasIncorrect = state.buzzWindow?.status === "locked" && Boolean(state.buzzWindow.lockedTeamIds.length);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href="/host"><ArrowLeft size={16} /> Game Master overview</Link>
          <p className="eyebrow">Main event controls</p>
          <h1>Bible Jeopardy</h1>
        </div>
        <div className={styles.headerStatus}>
          <span className="status-pill status-live"><Radio size={13} /> Synced</span>
          <Link className="button button-ghost" href="/display" target="_blank"><Eye size={17} /> Open display</Link>
        </div>
      </header>

      <ScoreStrip state={state} compact />

      <div className={question ? styles.liveLayout : undefined}>
        <section className={styles.boardPanel}>
          <div className={styles.panelHeading}>
            <div><span>Question board</span><strong>{state.questions.filter((item) => !item.used).length} clues remaining</strong></div>
            {question ? <button className="button button-ghost" onClick={() => dispatch({ type: "return-to-board" })} type="button"><RotateCcw size={16} /> Back to board</button> : null}
          </div>
          <JeopardyBoard
            state={state}
            onSelect={(questionId) => dispatch({ type: "select-question", questionId, at: timestamp() })}
          />
        </section>

        {question ? (
          <aside className={styles.questionConsole}>
            <div className={styles.questionMeta}>
              <span>{question.category}</span>
              <strong>${question.value}</strong>
            </div>
            <div className={styles.clue}>
              <small>{question.ageBand} • {question.sourceId}</small>
              <h2>{question.clue}</h2>
              <div className={styles.answer}><span>Accepted answer</span><p>{question.answer}</p></div>
            </div>

            <div className={styles.buzzStatus} data-status={state.buzzWindow?.status}>
              <span><Radio size={17} /> Buzzer status</span>
              <strong>
                {state.buzzWindow?.status === "open" ? "Open — waiting for a buzz" : null}
                {state.buzzWindow?.status === "claimed" ? `${winner?.name} • ${winnerTeam?.name}` : null}
                {state.buzzWindow?.status === "locked" && !wasIncorrect ? "Locked while you read" : null}
                {wasIncorrect ? `${winnerTeam?.name} is locked out` : null}
              </strong>
            </div>

            <div className={styles.controls}>
              {!question.used && state.buzzWindow?.status === "locked" ? (
                <button className="button button-gold" onClick={() => dispatch({ type: "open-buzzers", at: timestamp() })} type="button">
                  <Unlock size={19} /> {wasIncorrect ? "Reopen for other teams" : "Open buzzers"}
                </button>
              ) : null}
              {state.buzzWindow?.status === "open" ? (
                <button className="button button-ghost" disabled type="button"><Radio size={18} /> Waiting for first buzz…</button>
              ) : null}
              {state.buzzWindow?.status === "claimed" ? (
                <div className={styles.judgeControls}>
                  <button className="button" onClick={() => dispatch({ type: "mark-correct", at: timestamp() })} type="button"><Check size={21} /> Correct</button>
                  <button className="button button-danger" onClick={() => dispatch({ type: "mark-incorrect", at: timestamp() })} type="button"><X size={21} /> Incorrect</button>
                </div>
              ) : null}
              {question.used ? (
                <button className="button button-dark" onClick={() => dispatch({ type: "return-to-board" })} type="button"><CircleStop size={18} /> Close clue</button>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
