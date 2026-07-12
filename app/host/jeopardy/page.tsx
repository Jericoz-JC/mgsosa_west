"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, CircleStop, Eye, LibraryBig, Minus, Plus, Radio, RotateCcw, Unlock, X } from "lucide-react";
import { JeopardyBoard } from "@/components/game/jeopardy-board";
import { useGame } from "@/components/game/game-provider";
import { ScoreStrip } from "@/components/game/score-strip";
import { getCurrentQuestion } from "@/lib/game/engine";
import { timestamp } from "@/lib/game/time";
import styles from "./jeopardy.module.css";

export default function JeopardyHostPage() {
  const { state, dispatch, jeopardySets, resolveJeopardyManually } = useGame();
  const [manualValue, setManualValue] = useState(100);
  const [manualBusy, setManualBusy] = useState(false);
  const question = getCurrentQuestion(state);
  const winner = state.players.find((player) => player.id === state.buzzWindow?.winnerPlayerId);
  const winnerTeam = state.teams.find((team) => team.id === winner?.teamId);
  const wasIncorrect = state.buzzWindow?.status === "locked" && Boolean(state.buzzWindow.lockedTeamIds.length);
  const activeSet = jeopardySets.find((set) => set.active);
  const builtInBoards = !activeSet || activeSet.id === null;

  async function resolveManual(teamId: string | null, multiplier: -1 | 0 | 1) {
    setManualBusy(true);
    try { await resolveJeopardyManually(teamId, multiplier); }
    finally { setManualBusy(false); }
  }

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
          <Link className="button button-ghost" href="/host/jeopardy/sets"><LibraryBig size={17} /> Game sets</Link>
          <Link className="button button-ghost" href="/display" target="_blank"><Eye size={17} /> Open display</Link>
        </div>
      </header>

      <ScoreStrip state={state} compact />

      <section className={styles.manualLedger}>
        <div><p className="eyebrow">No buzzer needed</p><h2>Manual score desk</h2><p>Use this while screen-sharing or for bonuses. It does not consume a board card.</p></div>
        <label>Points<input min="1" max="5000" step="50" type="number" value={manualValue} onChange={(event) => setManualValue(Math.max(1, Number(event.target.value) || 1))} /></label>
        <div className={styles.manualTeams}>{state.teams.map((team) => <article style={{ "--team-color": team.color } as React.CSSProperties} key={team.id}><strong>{team.shortName}</strong><button onClick={() => dispatch({ type: "adjust-score", teamId: team.id, delta: manualValue, reason: "Manual Jeopardy score", at: timestamp() })} type="button"><Plus size={15} />{manualValue}</button><button onClick={() => dispatch({ type: "adjust-score", teamId: team.id, delta: -manualValue, reason: "Manual Jeopardy deduction", at: timestamp() })} type="button"><Minus size={15} />{manualValue}</button></article>)}</div>
      </section>

      <nav className={styles.roundPicker} aria-label="Jeopardy round">
        <div><span>Question set</span><strong>{activeSet?.title ?? `Round ${state.jeopardyRound} of 2`}</strong></div>
        {builtInBoards ? <><button aria-pressed={state.jeopardyRound === 1} disabled={Boolean(question)} onClick={() => dispatch({ type: "set-jeopardy-round", round: 1 })} type="button">Round 1</button><button aria-pressed={state.jeopardyRound === 2} disabled={Boolean(question)} onClick={() => dispatch({ type: "set-jeopardy-round", round: 2 })} type="button">Round 2</button></> : null}
        <p>{builtInBoards ? "Round 2 adds 30 fresh clues and keeps every team score." : "Saved custom board · scores remain in the shared event ledger."}</p>
      </nav>

      <div className={question ? styles.liveLayout : undefined}>
        <section className={styles.boardPanel}>
          <div className={styles.panelHeading}>
            <div><span>Round {state.jeopardyRound} board</span><strong>{state.questions.filter((item) => item.round === state.jeopardyRound && !item.used).length} clues remaining</strong></div>
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
            {!question.used ? <div className={styles.manualResolve}><span>Or resolve without website buzzers</span><div>{state.teams.map((team) => <article key={team.id}><strong>{team.shortName}</strong><button disabled={manualBusy} onClick={() => resolveManual(team.id, 1)} type="button">+${question.value}</button><button disabled={manualBusy} onClick={() => resolveManual(team.id, -1)} type="button">−${question.value}</button></article>)}</div><button disabled={manualBusy} onClick={() => resolveManual(null, 0)} type="button">No score · mark card used</button></div> : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
