import type { Metadata } from "next";
import { Suspense } from "react";
import { QAForum } from "@/components/qa/qa-forum";
import shared from "@/components/site/site.module.css";

export const metadata: Metadata = {
  title: "Ask the Clergy",
  description: "Common questions youth ask priests, bishops, and guest speakers at MGSOSA conferences, with clergy-verified answers.",
};

export default function QAPage() {
  return (
    <>
      <section className={shared.pageHero}>
        <div className="container">
          <p className="eyebrow">Conference Q&A • Ask the Clergy</p>
          <h1 className="display-title">Honest questions.<br /><em>Verified answers.</em></h1>
          <p className={shared.lede}>
            The questions youth ask our priests, bishops, and guest speakers—at conferences, Bible studies, and anytime. Every answer here has been verified by clergy. Filter by conference or browse everything.
          </p>
          <div className={shared.heroActions}>
            <a className="button button-gold" href="#ask">Ask a question</a>
          </div>
        </div>
      </section>
      <div style={{ paddingTop: 32 }}>
        <Suspense fallback={null}>
          <QAForum />
        </Suspense>
      </div>
    </>
  );
}
