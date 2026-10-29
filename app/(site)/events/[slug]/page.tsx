import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, Gamepad2, MapPin, MessageCircleQuestion } from "lucide-react";
import { EventStatusTag } from "@/components/site/event-card";
import { eventKindLabel, getEvent, siteEvents } from "@/lib/site/events";
import { activeEventCode, gameEvents } from "@/lib/game/event-config";
import { getGame } from "@/lib/games/registry";
import shared from "@/components/site/site.module.css";

export function generateStaticParams() {
  return siteEvents.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const event = getEvent((await params).slug);
  return event ? { title: event.title, description: event.summary } : {};
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const event = getEvent((await params).slug);
  if (!event) notFound();
  const gameConfig = event.gameEventCode ? gameEvents[event.gameEventCode] : undefined;
  const gameIds = gameConfig ? [...new Set([...gameConfig.rooms.map((room) => room.game), "bible-jeopardy"])] : [];

  return (
    <>
      <section className={shared.pageHero}>
        <div className="container">
          <Link className={shared.textLink} href="/events"><ArrowLeft aria-hidden size={15} /> All events</Link>
          <div className={shared.tagRow} style={{ marginTop: 22 }}>
            <span className={shared.tag}>{eventKindLabel[event.kind]}</span>
            <EventStatusTag event={event} />
          </div>
          <h1 className="display-title" style={{ fontSize: "clamp(2.8rem, 6vw, 5.4rem)" }}>{event.title}</h1>
          <p className={shared.lede}>{event.summary}</p>
          <ul className={shared.meta} style={{ fontSize: "0.95rem" }}>
            <li><CalendarDays aria-hidden size={17} /> {event.dateLabel}</li>
            {event.timeLabel ? <li><Clock3 aria-hidden size={17} /> {event.timeLabel}</li> : null}
            <li><MapPin aria-hidden size={17} /> {event.location}</li>
          </ul>
          <div className={shared.heroActions}>
            {event.cta ? <Link className="button button-primary" href={event.cta.href}>{event.cta.label} <ArrowRight aria-hidden size={18} /></Link> : null}
            {event.conferenceSlug && event.cta?.href.startsWith("/qa") !== true ? (
              <Link className="button button-ghost" href={`/qa?conference=${event.conferenceSlug}`}><MessageCircleQuestion aria-hidden size={18} /> Conference Q&A</Link>
            ) : null}
          </div>
          {event.status === "proposed" ? (
            <p className="muted" style={{ marginTop: 18, fontSize: "0.84rem" }}>This date is proposed and will be confirmed by the regional team. Registration details will be posted here and in the WhatsApp community.</p>
          ) : null}
        </div>
      </section>

      <section className={`container ${shared.section}`}>
        <div className={shared.twoCol}>
          <div style={{ display: "grid", gap: 28 }}>
            {event.theme ? (
              <div>
                <p className="eyebrow">Theme • {event.theme.title}</p>
                <blockquote className={shared.verse}>
                  <p>“{event.theme.verse}”</p>
                  <cite>{event.theme.reference}</cite>
                </blockquote>
              </div>
            ) : null}
            {event.highlights?.length ? (
              <div>
                <h2 className="section-title">Highlights</h2>
                <ul className={shared.checkList}>{event.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            ) : null}
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            {event.schedule?.length ? (
              <div className={`${shared.panel} ${shared.posterPanel}`}>
                <h3>Run of show</h3>
                <ol style={{ display: "grid", gap: 0, margin: "12px 0 0", padding: 0, listStyle: "none" }}>
                  {event.schedule.map((row) => (
                    <li key={row.time} style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 12, padding: "11px 0", borderTop: "1px solid var(--line)" }}>
                      <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--blue-600)" }}>{row.time}</strong>
                      <span>{row.item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            {gameConfig ? (
              <div className={shared.panel}>
                <h3>Games on the night</h3>
                <ul className={shared.checkList} style={{ marginTop: 12 }}>
                  {gameIds.map((id) => { const game = getGame(id); return game ? <li key={id}><strong>{game.name}.</strong> {game.tagline}</li> : null; })}
                </ul>
                {gameConfig.code === activeEventCode ? (
                  <Link className="button button-gold" href="/game" style={{ marginTop: 18, width: "100%" }}><Gamepad2 aria-hidden size={18} /> Game Mode • code {gameConfig.code}</Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
