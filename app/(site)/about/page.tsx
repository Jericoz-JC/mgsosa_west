import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { leadershipRoles, ministries, site } from "@/lib/site/site";
import shared from "@/components/site/site.module.css";

export const metadata: Metadata = {
  title: "About",
  description: `${site.fullName}, ${site.region}: who we are, our mission, and how the regional team works.`,
};

export default function AboutPage() {
  return (
    <>
      <section className={shared.pageHero}>
        <div className="container">
          <p className="eyebrow">About MGSOSA West</p>
          <h1 className="display-title">Rooted in the Church.<br /><em>Built by youth.</em></h1>
          <p className={shared.lede}>
            MGSOSA—the {site.fullName}—is the youth organization of the {site.archdiocese}. The Western Region connects youth across nine parishes in Arizona, California, Colorado, Oregon, and Washington.
          </p>
        </div>
      </section>

      <section className={`container ${shared.section}`}>
        <div className={shared.twoCol}>
          <div className={shared.prose}>
            <p className="eyebrow">Our mission</p>
            <blockquote className={shared.verse}>
              <p>“{site.mission}”</p>
              <cite>MGSOSA West mission statement • {site.missionDate}</cite>
            </blockquote>
            <h2 className="section-title" style={{ marginTop: 48 }}>Why the West gathers</h2>
            <p>
              Many of our parishes are small, and youth can go years without meeting others their age who share the same faith. Regional events let you know you are part of something bigger than your home parish—and leave with real friends across the diocese.
            </p>
            <p>
              Our Western Region started up again in 2020. Today the team plans monthly online Bible studies, a fellowship conference, game nights, and a summer retreat, with major events planned about six months ahead.
            </p>
            <p>
              MGSOSA is for {site.ageRange.toLowerCase()}. Its president is {site.president} of the Malankara Archdiocese.
            </p>
          </div>
          <figure style={{ margin: 0 }}>
            <div style={{ position: "relative", aspectRatio: "1320 / 2037", maxWidth: 420, marginInline: "auto", overflow: "hidden", borderRadius: 12, border: "2px solid var(--navy-900)", boxShadow: "8px 8px 0 var(--gold)" }}>
              <Image src="/photos/mor-gregorios.jpg" alt="Painting of Mor Gregorios in liturgical vestments holding a hand cross and staff" fill sizes="(max-width: 820px) 90vw, 420px" style={{ objectFit: "cover" }} />
            </div>
            <figcaption className="muted" style={{ marginTop: 12, fontSize: "0.8rem", textAlign: "center" }}>Our association is named for Mor Gregorios.</figcaption>
          </figure>
        </div>
      </section>

      <section className={`container ${shared.section}`}>
        <div className={shared.sectionHead}>
          <div><p className="eyebrow">How the team works</p><h2 className="section-title">Regional leadership</h2></div>
          <p>Logistics—dates, orders, flyers, meeting times—are decided by the whole team together. The Spiritual Advisor has full authority on the spiritual side of every event.</p>
        </div>
        <div className={shared.cardGrid}>
          {leadershipRoles.map((role) => (
            <article className={shared.panel} key={role.title}>
              <h3>{role.title}</h3>
              <p>{role.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`container ${shared.section}`}>
        <div className={shared.sectionHead}>
          <div><p className="eyebrow">What we do</p><h2 className="section-title">Throughout the year</h2></div>
        </div>
        <ul className={shared.checkList}>
          {ministries.map((ministry) => <li key={ministry.title}><strong>{ministry.title}.</strong> {ministry.detail}</li>)}
        </ul>
      </section>

      <section className={`container ${shared.section}`}>
        <div className={shared.callout}>
          <div>
            <p className={shared.eyebrowLight}>Get involved</p>
            <h2 className="section-title">Represent your parish</h2>
            <p>Parish youth representatives (15+) plan regional events and carry decisions home to their clergy and youth. Talk to your vicar or email the team to learn how to join.</p>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <a className="button button-gold" href={`mailto:${site.email}`}><Mail aria-hidden size={18} /> Email the team</a>
            <Link className="button button-ghost" href="/churches" style={{ color: "white", background: "transparent", borderColor: "rgba(255,255,255,.3)" }}>Our parishes <ArrowRight aria-hidden size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
