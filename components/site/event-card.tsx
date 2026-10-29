import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { eventKindLabel, type SiteEvent } from "@/lib/site/events";
import styles from "./site.module.css";

export function EventStatusTag({ event }: { event: SiteEvent }) {
  if (event.status === "proposed") return <span className={`${styles.tag} ${styles.tagGold}`}>Date proposed</span>;
  if (event.status === "recurring") return <span className={`${styles.tag} ${styles.tagGreen}`}>Recurring</span>;
  return null;
}

export function EventCard({ event, past = false }: { event: SiteEvent; past?: boolean }) {
  return (
    <article className={styles.panel} style={{ display: "grid", alignContent: "start" }}>
      <div className={styles.tagRow}>
        <span className={styles.tag}>{eventKindLabel[event.kind]}</span>
        {past ? null : <EventStatusTag event={event} />}
      </div>
      <h3>{event.title}</h3>
      <p>{event.summary}</p>
      <ul className={styles.meta}>
        <li><CalendarDays aria-hidden size={16} /> <span>{event.dateLabel}{event.timeLabel ? ` • ${event.timeLabel}` : ""}</span></li>
        <li><MapPin aria-hidden size={16} /> <span>{event.location}</span></li>
      </ul>
      <Link className={styles.textLink} href={`/events/${event.slug}`} style={{ marginTop: 18 }}>
        Event details <ArrowRight aria-hidden size={15} />
      </Link>
    </article>
  );
}
