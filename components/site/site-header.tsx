"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Gamepad2, Menu, X } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { primaryNav } from "@/lib/site/site";
import styles from "./site-header.module.css";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={styles.header} data-open={open || undefined}>
      <div className={`container ${styles.bar}`}>
        <BrandLockup />
        <nav className={styles.nav} aria-label="Main navigation">
          {primaryNav.map((item) => (
            <Link aria-current={isActive(item.href) ? "page" : undefined} href={item.href} key={item.href}>{item.label}</Link>
          ))}
        </nav>
        <div className={styles.actions}>
          <Link aria-label="Game Mode" className={`button button-gold ${styles.gameButton}`} href="/game">
            <Gamepad2 aria-hidden size={18} /> <span>Game Mode</span>
          </Link>
          <button
            aria-controls="mobile-menu"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className={styles.menuButton}
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </button>
        </div>
      </div>
      <nav className={styles.mobileNav} hidden={!open} id="mobile-menu" aria-label="Mobile navigation">
        <div className="container">
          <Link aria-current={pathname === "/" ? "page" : undefined} href="/" onClick={() => setOpen(false)}>Home</Link>
          {primaryNav.map((item) => (
            <Link aria-current={isActive(item.href) ? "page" : undefined} href={item.href} key={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
          ))}
          <Link className="button button-gold" href="/game" onClick={() => setOpen(false)}><Gamepad2 aria-hidden size={18} /> Enter Game Mode</Link>
        </div>
      </nav>
    </header>
  );
}
