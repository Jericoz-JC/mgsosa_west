"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Gamepad2, KeyRound, LayoutDashboard, MonitorUp, RotateCcw, UsersRound } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { useGame } from "@/components/game/game-provider";
import { StaffPinGate } from "@/components/host/staff-pin-gate";
import styles from "./host-shell.module.css";

const nav = [
  { href: "/host", label: "Overview", icon: LayoutDashboard },
  { href: "/host/jeopardy", label: "Jeopardy", icon: Gamepad2 },
  { href: "/host/room", label: "Breakout rooms", icon: UsersRound },
  { href: "/display", label: "Display", icon: MonitorUp, external: true },
];

export function HostShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, reset, mode, clearHostPin } = useGame();

  return (
    <StaffPinGate>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <BrandLockup href="/host" inverse />
          <nav aria-label="Game Master navigation">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/host" ? pathname === "/host" : pathname.startsWith(item.href);
              return (
                <Link className={active ? styles.active : undefined} href={item.href} key={item.href} target={item.external ? "_blank" : undefined}>
                  <Icon aria-hidden size={19} />
                  <span>{item.label}</span>
                  {item.external ? <ExternalLink className={styles.external} aria-hidden size={13} /> : null}
                </Link>
              );
            })}
          </nav>
          <div className={styles.sidebarFooter}>
            <div>
              <span className="status-pill status-live">Live</span>
              <strong>{state.eventCode}</strong>
              <small>{mode === "convex" ? "Hosted realtime sync" : `${state.players.filter((player) => player.connected).length} demo players connected`}</small>
            </div>
            {mode === "convex" ? (
              <button onClick={clearHostPin} type="button"><KeyRound aria-hidden size={15} /> Lock console</button>
            ) : (
              <button onClick={reset} type="button"><RotateCcw aria-hidden size={15} /> Reset demo</button>
            )}
          </div>
        </aside>
        <main className={styles.content}>{children}</main>
      </div>
    </StaffPinGate>
  );
}
