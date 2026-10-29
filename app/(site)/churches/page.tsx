import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { parishes } from "@/lib/site/parishes";
import { site } from "@/lib/site/site";
import shared from "@/components/site/site.module.css";

export const metadata: Metadata = {
  title: "Churches",
  description: "The nine parishes of the MGSOSA West region.",
};

export default function ChurchesPage() {
  const states = [...new Set(parishes.map((parish) => parish.state))];
  return (
    <>
      <section className={shared.pageHero}>
        <div className="container">
          <p className="eyebrow">Our parishes</p>
          <h1 className="display-title">Nine churches.<br /><em>One region.</em></h1>
          <p className={shared.lede}>Each parish sends youth representatives to the MGSOSA West Leadership Team. New to the area or visiting? You’re welcome at any of them—and at every regional event.</p>
        </div>
      </section>
      {states.map((state) => (
        <section className={`container ${shared.section}`} key={state} style={{ paddingTop: 48 }}>
          <div className={shared.sectionHead}><h2 className="section-title">{stateName(state)}</h2></div>
          <div className={shared.cardGrid}>
            {parishes.filter((parish) => parish.state === state).map((parish) => (
              <article className={shared.panel} key={parish.id}>
                <h3>{parish.name}</h3>
                <ul className={shared.meta}><li><MapPin aria-hidden size={16} /> {parish.city}, {parish.state}</li></ul>
              </article>
            ))}
          </div>
        </section>
      ))}
      <section className={`container ${shared.section}`}>
        <p className={shared.empty}>Is your parish missing or listed incorrectly? Email <a href={`mailto:${site.email}`} style={{ color: "var(--blue-600)", fontWeight: 800 }}>{site.email}</a>.</p>
      </section>
    </>
  );
}

function stateName(code: string) {
  return ({ AZ: "Arizona", CA: "California", CO: "Colorado", OR: "Oregon", WA: "Washington" } as Record<string, string>)[code] ?? code;
}
