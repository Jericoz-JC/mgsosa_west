import Link from "next/link";
import { ArrowRight, CalendarDays, Gamepad2 } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { siteEvents, splitEvents, todayInPacific } from "@/lib/site/events";

/** Shown across Game Mode while no event is live on the server. */
export function NoActiveEvent() {
  const next = splitEvents(siteEvents, todayInPacific()).upcoming.find((event) => event.kind === "game-night");
  return (
    <main className="page-shell" style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <header className="container topbar"><BrandLockup subtitle="Game Mode" /></header>
      <section className="container" style={{ display: "grid", placeItems: "center", paddingBlock: "8vh 64px" }}>
        <div className="card" style={{ width: "min(100%, 560px)", padding: "clamp(24px, 5vw, 40px)", display: "grid", gap: 14, boxShadow: "6px 6px 0 var(--navy-900)", border: "2px solid var(--navy-900)" }}>
          <span className="status-pill status-waiting"><Gamepad2 size={13} aria-hidden /> Game Mode</span>
          <h1 className="section-title" style={{ margin: 0 }}>No game night is live right now</h1>
          <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
            Game Mode opens on the night of an MGSOSA West game night. Your host will share the link and event code in Zoom and the WhatsApp community.
          </p>
          {next ? (
            <Link className="button button-ghost" href={`/events/${next.slug}`} style={{ justifyContent: "space-between" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><CalendarDays size={17} aria-hidden /> Next: {next.title} • {next.dateLabel}</span>
              <ArrowRight size={17} aria-hidden />
            </Link>
          ) : null}
          <Link className="button button-gold" href="/">Back to the main website</Link>
        </div>
      </section>
    </main>
  );
}
