import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, MessageCircleQuestion } from "lucide-react";
import { conferences } from "@/lib/qa/conferences";
import { getEvent } from "@/lib/site/events";
import shared from "@/components/site/site.module.css";

export const metadata: Metadata = {
  title: "Conferences",
  description: "MGSOSA West conferences and gatherings, with the clergy Q&A from each one.",
};

export default function ConferencesPage() {
  return (
    <>
      <section className={shared.pageHero}>
        <div className="container">
          <p className="eyebrow">Conferences</p>
          <h1 className="display-title">Gather. Serve.<br /><em>Ask.</em></h1>
          <p className={shared.lede}>
            Every conference ends with the same moment: youth asking our priests, bishops, and guest speakers the questions they’ve been carrying. We keep those questions—and clergy-verified answers—so the conversation keeps going after the weekend.
          </p>
          <div className={shared.heroActions}>
            <Link className="button button-primary" href="/qa?conference=conferences"><MessageCircleQuestion aria-hidden size={18} /> All conference Q&A</Link>
            <Link className="button button-ghost" href="/qa#ask">Ask a question</Link>
          </div>
        </div>
      </section>
      <section className={`container ${shared.section}`}>
        <div className={shared.cardGrid}>
          {conferences.map((conference) => {
            const event = conference.eventSlug ? getEvent(conference.eventSlug) : undefined;
            return (
              <article className={`${shared.panel} ${shared.posterPanel}`} key={conference.slug}>
                <div className={shared.tagRow}><span className={shared.tag}>{conference.shortName}</span></div>
                <h3>{conference.name}</h3>
                {conference.theme ? <p><strong>{conference.theme}</strong></p> : null}
                {event ? <p style={{ marginTop: 8 }}>{event.summary}</p> : null}
                <ul className={shared.meta}>
                  <li><CalendarDays aria-hidden size={16} /> {conference.dateLabel}</li>
                  <li><MapPin aria-hidden size={16} /> {conference.location}</li>
                </ul>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 18 }}>
                  <Link className={shared.textLink} href={`/qa?conference=${conference.slug}`}>Questions + answers <ArrowRight aria-hidden size={15} /></Link>
                  {event ? <Link className={shared.textLink} href={`/events/${event.slug}`}>Event page <ArrowRight aria-hidden size={15} /></Link> : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <section className={`container ${shared.section}`}>
        <div className={shared.panel}>
          <h3>How conference questions get here</h3>
          <ul className={shared.checkList} style={{ marginTop: 14 }}>
            <li>Anyone can submit a question online—before, during, or after a conference. Names are optional.</li>
            <li>MGSOSA West admins review every submission before it appears publicly.</li>
            <li>Questions asked live in a session can be added by admins, along with the answer given.</li>
            <li>Every published answer is verified by a priest, bishop, or the guest speaker who gave it. Clergy choose whether their name is shown.</li>
          </ul>
        </div>
      </section>
    </>
  );
}
