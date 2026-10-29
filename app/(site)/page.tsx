import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Church, Gamepad2, HandHeart, MapPin, MessageCircleQuestion, Tent, Users } from "lucide-react";
import { EventCard, EventStatusTag } from "@/components/site/event-card";
import { siteEvents, splitEvents, todayInPacific } from "@/lib/site/events";
import { parishes } from "@/lib/site/parishes";
import { ministries, site } from "@/lib/site/site";
import shared from "@/components/site/site.module.css";
import styles from "./home.module.css";

// Rebuild hourly so "upcoming" stays accurate without a redeploy.
export const revalidate = 3600;

const ministryIcons = [BookOpen, Users, Gamepad2, Tent, HandHeart];

export default function HomePage() {
  const { upcoming, past } = splitEvents(siteEvents, todayInPacific());
  const featured = upcoming.find((event) => event.status !== "recurring") ?? upcoming[0];
  const others = upcoming.filter((event) => event !== featured).slice(0, 2);

  return (
    <>
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className="eyebrow">{site.fullName} • {site.region}</p>
            <h1 className="display-title">Faith.<br /><em>Fellowship.</em><br />The West.</h1>
            <p className={shared.lede}>
              Syriac Orthodox youth from nine parishes—from Seattle to San Diego to Denver—growing in faith together through Bible studies, conferences, service, and game nights.
            </p>
            <div className={shared.heroActions}>
              <Link className="button button-primary" href="/events">See upcoming events <ArrowRight aria-hidden size={18} /></Link>
              <Link className="button button-ghost" href="/qa"><MessageCircleQuestion aria-hidden size={18} /> Ask the Clergy</Link>
            </div>
          </div>
          <div className={styles.heroArt}>
            <div className={styles.badge}>
              <Image src="/brand/mgsosa-west-badge.jpg" alt="MGSOSA West badge" fill sizes="(max-width: 900px) 70vw, 420px" priority />
            </div>
            {featured ? (
              <Link className={styles.nextCard} href={`/events/${featured.slug}`}>
                <span className={styles.nextLabel}>Next up</span>
                <strong>{featured.title}</strong>
                <span><CalendarDays aria-hidden size={15} /> {featured.dateLabel}</span>
                <span><MapPin aria-hidden size={15} /> {featured.location}</span>
                <EventStatusTag event={featured} />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container">
        <Link className={styles.gameStrip} href="/game">
          <span className={styles.gameIcon}><Gamepad2 aria-hidden /></span>
          <span>
            <strong>Joining a game night?</strong>
            <small>Enter Game Mode with your event code, name, and church. No account or download.</small>
          </span>
          <span className={styles.gameCta}>Enter Game Mode <ArrowRight aria-hidden size={18} /></span>
        </Link>
      </section>

      <section className={`container ${shared.section}`}>
        <div className={shared.sectionHead}>
          <div><p className="eyebrow">Upcoming</p><h2 className="section-title">Coming up in the West</h2></div>
          <Link className={shared.textLink} href="/events">All events <ArrowRight aria-hidden size={15} /></Link>
        </div>
        <div className={shared.cardGrid}>
          {[featured, ...others].filter(Boolean).map((event) => <EventCard event={event!} key={event!.slug} />)}
        </div>
      </section>

      <section className={`container ${shared.section}`}>
        <div className={shared.sectionHead}>
          <div><p className="eyebrow">What we do</p><h2 className="section-title">Grow in faith, together</h2></div>
          <p>{site.mission}</p>
        </div>
        <div className={styles.ministryGrid}>
          {ministries.map((ministry, index) => {
            const Icon = ministryIcons[index] ?? Church;
            return (
              <article className={styles.ministry} key={ministry.title}>
                <Icon aria-hidden />
                <h3>{ministry.title}</h3>
                <p>{ministry.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className={`container ${shared.section}`}>
        <div className={shared.callout}>
          <div>
            <p className={shared.eyebrowLight}>Ask the Clergy</p>
            <h2 className="section-title">The questions everyone asks</h2>
            <p>At every conference, youth ask our priests, bishops, and guest speakers the same honest questions. We collect them here with clergy-verified answers—filter by conference or browse everything.</p>
          </div>
          <div className={styles.calloutActions}>
            <Link className="button button-gold" href="/qa">Browse answers <ArrowRight aria-hidden size={18} /></Link>
            <Link className="button button-ghost" href="/qa#ask">Ask a question</Link>
          </div>
        </div>
      </section>

      <section className={`container ${shared.section}`}>
        <div className={shared.sectionHead}>
          <div><p className="eyebrow">Our parishes</p><h2 className="section-title">Nine churches. One region.</h2></div>
          <Link className={shared.textLink} href="/churches">Find your parish <ArrowRight aria-hidden size={15} /></Link>
        </div>
        <ul className={styles.parishStrip}>
          {parishes.map((parish) => (
            <li key={parish.id}><strong>{parish.city}</strong><span>{parish.state}</span></li>
          ))}
        </ul>
      </section>

      {past.length ? (
        <section className={`container ${shared.section}`}>
          <div className={shared.sectionHead}>
            <div><p className="eyebrow">Recently</p><h2 className="section-title">Where we’ve been</h2></div>
          </div>
          <div className={shared.cardGrid}>
            {past.slice(0, 3).map((event) => <EventCard event={event} key={event.slug} past />)}
          </div>
        </section>
      ) : null}
    </>
  );
}
