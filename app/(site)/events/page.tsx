import type { Metadata } from "next";
import { EventCard } from "@/components/site/event-card";
import { siteEvents, splitEvents, todayInPacific } from "@/lib/site/events";
import shared from "@/components/site/site.module.css";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming and past MGSOSA West events: game nights, conferences, Bible studies, and retreats.",
};

export const revalidate = 3600;

export default function EventsPage() {
  const { upcoming, past } = splitEvents(siteEvents, todayInPacific());
  return (
    <>
      <section className={shared.pageHero}>
        <div className="container">
          <p className="eyebrow">Events</p>
          <h1 className="display-title">See you<br /><em>there.</em></h1>
          <p className={shared.lede}>Online and in person, across every parish in the Western Region. Dates marked “proposed” are still waiting on the regional team’s vote.</p>
        </div>
      </section>
      <section className={`container ${shared.section}`}>
        <div className={shared.sectionHead}><h2 className="section-title">Upcoming</h2></div>
        {upcoming.length ? (
          <div className={shared.cardGrid}>{upcoming.map((event) => <EventCard event={event} key={event.slug} />)}</div>
        ) : <p className={shared.empty}>New events are announced in the WhatsApp community. Check back soon.</p>}
      </section>
      {past.length ? (
        <section className={`container ${shared.section}`}>
          <div className={shared.sectionHead}><h2 className="section-title">Past events</h2></div>
          <div className={shared.cardGrid}>{past.map((event) => <EventCard event={event} key={event.slug} past />)}</div>
        </section>
      ) : null}
    </>
  );
}
