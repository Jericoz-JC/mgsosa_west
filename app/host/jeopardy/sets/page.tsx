"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, LibraryBig, Plus, Save, Trash2 } from "lucide-react";
import { useGame } from "@/components/game/game-provider";
import type { JeopardyCardInput } from "@/lib/game/types";
import styles from "./sets.module.css";

const emptyCard = (category = "", value = 100): JeopardyCardInput => ({ category, value, clue: "", answer: "" });

export default function JeopardySetsPage() {
  const { jeopardySets, createJeopardySet, activateJeopardySet } = useGame();
  const [title, setTitle] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [cards, setCards] = useState<JeopardyCardInput[]>([emptyCard()]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();

  function updateCard(index: number, patch: Partial<JeopardyCardInput>) {
    setCards((current) => current.map((card, cardIndex) => cardIndex === index ? { ...card, ...patch } : card));
  }

  function addCategory() {
    const category = categoryName.trim();
    if (!category) return;
    setCards((current) => [
      ...current.filter((card) => card.category || card.clue || card.answer),
      ...[100, 200, 300, 400, 500].map((value) => emptyCard(category, value)),
    ]);
    setCategoryName("");
  }

  async function save() {
    setBusy(true); setMessage(undefined);
    try {
      await createJeopardySet(title, cards);
      setMessage(`Saved and activated “${title.trim()}”.`);
      setTitle(""); setCards([emptyCard()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The set could not be saved.");
    } finally { setBusy(false); }
  }

  async function activate(id: string | null) {
    setBusy(true); setMessage(undefined);
    try { await activateJeopardySet(id); setMessage("Game board changed. The shared display updates automatically."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "The set could not be activated."); }
    finally { setBusy(false); }
  }

  const completeCards = cards.filter((card) => card.category.trim() && card.clue.trim() && card.answer.trim());

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div><Link href="/host/jeopardy"><ArrowLeft size={16} /> Back to Jeopardy</Link><p className="eyebrow">Game library</p><h1>Build the board<br />before the room fills.</h1></div>
        <LibraryBig aria-hidden />
      </header>

      <section className={styles.library}>
        <div><p className="eyebrow">Saved sets</p><h2>Choose the live board</h2><p>Changing sets keeps the event score ledger but clears the currently open clue.</p></div>
        <div className={styles.setList}>{jeopardySets.map((set) => <article data-active={set.active} key={set.id ?? "built-in"}><div>{set.active ? <CheckCircle2 size={18} /> : <LibraryBig size={18} />}<span><strong>{set.title}</strong><small>{set.questionCount} cards</small></span></div><button disabled={busy || set.active} onClick={() => activate(set.id)} type="button">{set.active ? "Live now" : "Use this set"}</button></article>)}</div>
      </section>

      <section className={styles.editor}>
        <div className={styles.editorHeading}><div><p className="eyebrow">New reusable set</p><h2>Card workshop</h2></div><label>Set title<input maxLength={80} placeholder="Example: Acts & the Early Church" value={title} onChange={(event) => setTitle(event.target.value)} /></label></div>
        <div className={styles.categoryMaker}><input maxLength={40} placeholder="New category name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} /><button disabled={!categoryName.trim()} onClick={addCategory} type="button"><Plus size={17} /> Add 100–500 category</button></div>
        <div className={styles.cardList}>
          {cards.map((card, index) => <article key={index}>
            <div className={styles.cardNumber}>{String(index + 1).padStart(2, "0")}</div>
            <label>Category<input maxLength={40} value={card.category} onChange={(event) => updateCard(index, { category: event.target.value })} /></label>
            <label className={styles.value}>Value<input min="1" max="5000" type="number" value={card.value} onChange={(event) => updateCard(index, { value: Number(event.target.value) })} /></label>
            <label className={styles.clue}>Clue<textarea maxLength={500} value={card.clue} onChange={(event) => updateCard(index, { clue: event.target.value })} /></label>
            <label className={styles.answer}>Accepted answer<textarea maxLength={300} value={card.answer} onChange={(event) => updateCard(index, { answer: event.target.value })} /></label>
            <button className={styles.remove} disabled={cards.length === 1} onClick={() => setCards((current) => current.filter((_, cardIndex) => cardIndex !== index))} type="button" aria-label={`Remove card ${index + 1}`}><Trash2 size={17} /></button>
          </article>)}
        </div>
        <footer><button className="button button-ghost" onClick={() => setCards((current) => [...current, emptyCard(current.at(-1)?.category ?? "", (current.at(-1)?.value ?? 0) + 100)])} type="button"><Plus size={17} /> Add one card</button><span>{completeCards.length} of {cards.length} cards complete</span><button className="button button-gold" disabled={busy || title.trim().length < 3 || completeCards.length !== cards.length} onClick={save} type="button"><Save size={18} /> {busy ? "Saving…" : "Save + make live"}</button></footer>
        {message ? <p className={styles.message} role="status">{message}</p> : null}
      </section>
    </div>
  );
}
