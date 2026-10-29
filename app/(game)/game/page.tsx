import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, MonitorUp, ShieldCheck } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { JoinForm } from "@/components/join/join-form";
import { activeGameEvent } from "@/lib/game/event-config";
import styles from "./game.module.css";

export default function GameModePage() {
  const event = activeGameEvent;
  const [lineOne, lineTwo, lineThree] = event.headline;

  return (
    <main className={`page-shell ${styles.landing}`}>
      <header className={`container topbar ${styles.topbar}`}>
        <BrandLockup href="/game" subtitle="Game Mode" />
        <div className={styles.staffLinks}>
          <Link aria-label="Main website" className={styles.siteLink} href="/"><ArrowLeft aria-hidden size={15} /> <span>Main website</span></Link>
          <Link href="/room">Room host</Link>
          <Link className="button button-dark" href="/host">Game Master</Link>
        </div>
      </header>

      <section className={`container ${styles.hero}`}>
        <div className={styles.heroStory}>
          <div className={styles.liveTag}><span /> Game Mode • {event.format}</div>
          <p className="eyebrow">{event.dayLabel} • {event.dateLabel}</p>
          <h1 className="display-title">{lineOne}<br /><em>{lineTwo}</em><br />{lineThree}</h1>
          <p className={styles.heroCopy}>{event.summary}</p>

          <div className={styles.eventFacts}>
            <div><CalendarDays aria-hidden /><span><strong>{event.dayLabel}</strong>{event.dateLabel}</span></div>
            <div><Clock3 aria-hidden /><span><strong>{event.timeLabel}</strong>{event.timezone}</span></div>
            <div><MonitorUp aria-hidden /><span><strong>Online</strong>Join through Zoom</span></div>
          </div>
        </div>

        <div className={styles.joinStage}>
          <div className={styles.brandDisc} aria-hidden>
            <Image src="/brand/mgsosa-west-badge.jpg" alt="" fill sizes="420px" priority />
          </div>
          <JoinForm />
        </div>
      </section>

      <section className={`container ${styles.roleNote}`}>
        <ShieldCheck aria-hidden />
        <p><strong>Different screen, right controls.</strong> Participants buzz and follow rotations. Room hosts run one activity. The Game Master sees the whole event.</p>
        <Link href="/display">Open display view →</Link>
      </section>
    </main>
  );
}
