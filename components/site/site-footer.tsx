import Link from "next/link";
import { Mail } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { primaryNav, site } from "@/lib/site/site";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.about}>
          <BrandLockup inverse />
          <p>{site.fullName}, {site.region}. A youth organization of the {site.archdiocese}.</p>
        </div>
        <nav aria-label="Footer navigation">
          <strong className={styles.colTitle}>Explore</strong>
          {primaryNav.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          <Link href="/game">Game Mode</Link>
        </nav>
        <div>
          <strong className={styles.colTitle}>Get in touch</strong>
          <a href={`mailto:${site.email}`}><Mail aria-hidden size={15} /> {site.email}</a>
          <p>Ask your parish youth representative to add you to the MGSOSA West WhatsApp community for event updates.</p>
        </div>
      </div>
      <div className={`container ${styles.legal}`}>
        <span>© {new Date().getFullYear()} MGSOSA West</span>
        <span>“That they all may be one.” — John 17:21</span>
      </div>
    </footer>
  );
}
