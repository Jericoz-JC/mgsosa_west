import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, MonitorUp, ShieldCheck } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { JoinForm } from "@/components/join/join-form";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={`page-shell ${styles.landing}`}>
      <header className={`container topbar ${styles.topbar}`}>
        <BrandLockup />
        <div className={styles.staffLinks}>
          <Link href="/room">Room admin</Link>
          <Link className="button button-dark" href="/host">Game Master</Link>
        </div>
      </header>

      <section className={`container ${styles.hero}`}>
        <div className={styles.heroStory}>
          <div className={styles.liveTag}><span /> Live online • Zoom + web</div>
          <p className="eyebrow">Saturday • July 11, 2026</p>
          <h1 className="display-title">One night.<br /><em>Three games.</em><br />All West.</h1>
          <p className={styles.heroCopy}>
            Find the Imposter, Gartic Phone, and a live Bible Jeopardy finale—organized in one simple console built for phones and screen sharing.
          </p>

          <div className={styles.eventFacts}>
            <div><CalendarDays aria-hidden /><span><strong>Saturday</strong>July 11</span></div>
            <div><Clock3 aria-hidden /><span><strong>5:30–7:30 PM</strong>Pacific time</span></div>
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
        <p><strong>Different screen, right controls.</strong> Participants buzz and follow rotations. Room admins run one activity. The Game Master sees the whole event.</p>
        <Link href="/display">Open display view →</Link>
      </section>
    </main>
  );
}
