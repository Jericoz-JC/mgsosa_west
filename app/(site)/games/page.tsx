import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, Gamepad2, Users } from "lucide-react";
import { GameIcon } from "@/components/site/game-icon";
import { activeGameEvent } from "@/lib/game/event-config";
import { gameFormatLabel, games, type GameFormat } from "@/lib/games/registry";
import shared from "@/components/site/site.module.css";
import styles from "./games.module.css";

export const metadata: Metadata = {
  title: "Games",
  description: "The MGSOSA West game library: breakout games for online game nights, Bible Jeopardy, and in-person icebreakers.",
};

const sections: Array<{ format: GameFormat; title: string; detail: string }> = [
  { format: "breakout", title: "Breakout room games", detail: "Run in parallel Zoom breakouts with the live Game Mode console: a room code, a host console, a timer, and scoring." },
  { format: "main-stage", title: "Main stage", detail: "Everyone together, screen shared, with a buzzer on every phone." },
  { format: "in-person", title: "In-person icebreakers + games", detail: "Tested at SOFC. Print-and-play favorites for conferences and retreats." },
];

export default function GamesPage() {
  return (
    <>
      <section className={shared.pageHero}>
        <div className="container">
          <p className="eyebrow">Game library</p>
          <h1 className="display-title">Play together.<br /><em>Learn together.</em></h1>
          <p className={shared.lede}>Every game MGSOSA West runs, with how to play, what you need, and how points work. Online game nights run in Game Mode—join from any phone with the event code.</p>
          <div className={shared.heroActions}>
            <Link className="button button-gold" href="/game"><Gamepad2 aria-hidden size={18} /> Enter Game Mode</Link>
            <Link className="button button-ghost" href={`/events/${activeGameEvent.eventSlug}`}>Next game night <ArrowRight aria-hidden size={16} /></Link>
          </div>
        </div>
      </section>

      {sections.map((section) => (
        <section className={`container ${shared.section}`} key={section.format}>
          <div className={shared.sectionHead}>
            <div><p className="eyebrow">{gameFormatLabel[section.format]}</p><h2 className="section-title">{section.title}</h2></div>
            <p>{section.detail}</p>
          </div>
          <div className={styles.gameGrid}>
            {games.filter((game) => game.format === section.format).map((game) => (
              <details className={styles.game} key={game.id} id={game.id}>
                <summary>
                  <span className={styles.icon}><GameIcon name={game.icon} /></span>
                  <span className={styles.title}>
                    <strong>{game.name}</strong>
                    <small>{game.tagline}</small>
                  </span>
                  <span className={styles.facts}>
                    <span><Users aria-hidden size={14} /> {game.players.ideal}</span>
                    <span><Clock3 aria-hidden size={14} /> {game.minutes} min</span>
                  </span>
                </summary>
                <div className={styles.body}>
                  <div>
                    <h3>How to play</h3>
                    <ol>{game.howToPlay.map((step) => <li key={step}>{step}</li>)}</ol>
                  </div>
                  <div>
                    <h3>You’ll need</h3>
                    <ul className={shared.checkList}>{game.materials.map((item) => <li key={item}>{item}</li>)}</ul>
                    <h3>Scoring</h3>
                    <p>{game.scoring}</p>
                    {game.fallback ? <><h3>Backup plan</h3><p>{game.fallback}</p></> : null}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
