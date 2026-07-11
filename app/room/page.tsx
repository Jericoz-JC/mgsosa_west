"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Link2, LoaderCircle, ShieldX } from "lucide-react";
import { useGame } from "@/components/game/game-provider";
import { RoomAdminConsole } from "@/components/room/room-admin-console";
import { ROOM_HOST_SESSION_KEY, roomHostTokenFromHash } from "@/lib/game/room-host";
import styles from "./room-access.module.css";

function AccessMessage({ state }: { state: "checking" | "missing" | "invalid" }) {
  const content = state === "checking"
    ? { icon: LoaderCircle, eyebrow: "Checking private link", title: "Opening your room…", detail: "Confirming the room assignment and loading the live roster." }
    : state === "invalid"
      ? { icon: ShieldX, eyebrow: "Link no longer active", title: "Ask for a new room link", detail: "The Game Master may have replaced or revoked this volunteer link." }
      : { icon: Link2, eyebrow: "Private link required", title: "Open the link from the Game Master", detail: "Room volunteers do not enter a PIN. Each volunteer receives one private link for one assigned room." };
  const Icon = content.icon;

  return (
    <section className={styles.accessCard} aria-live="polite">
      <span className={styles.icon}><Icon className={state === "checking" ? styles.spin : undefined} aria-hidden /></span>
      <p className="eyebrow">{content.eyebrow}</p>
      <h1>{content.title}</h1>
      <p>{content.detail}</p>
      {state !== "checking" ? <Link className="button button-dark" href="/"><KeyRound size={17} /> Return to event lobby</Link> : null}
    </section>
  );
}

export default function PrivateRoomPage() {
  const { mode, roomHostView, activateRoomHost, clearRoomHost } = useGame();
  const [accessState, setAccessState] = useState<"checking" | "missing">("checking");

  useEffect(() => {
    if (mode === "demo") return;
    const openLink = () => {
      const fragmentParams = new URLSearchParams(window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash);
      const hasHostFragment = fragmentParams.has("host");
      const fragmentToken = roomHostTokenFromHash(window.location.hash);
      if (hasHostFragment && !fragmentToken) {
        window.sessionStorage.removeItem(ROOM_HOST_SESSION_KEY);
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        clearRoomHost();
        queueMicrotask(() => setAccessState("checking"));
        return;
      }
      const token = fragmentToken ?? window.sessionStorage.getItem(ROOM_HOST_SESSION_KEY);
      if (!token) {
        clearRoomHost();
        queueMicrotask(() => setAccessState("missing"));
        return;
      }
      if (fragmentToken) {
        window.sessionStorage.setItem(ROOM_HOST_SESSION_KEY, fragmentToken);
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      }
      queueMicrotask(() => setAccessState("checking"));
      activateRoomHost(token);
    };

    openLink();
    window.addEventListener("hashchange", openLink);
    return () => window.removeEventListener("hashchange", openLink);
  }, [activateRoomHost, clearRoomHost, mode]);

  if (mode === "demo") return <RoomAdminConsole />;
  if (accessState === "missing") return <AccessMessage state="missing" />;
  if (roomHostView === undefined) return <AccessMessage state="checking" />;
  if (roomHostView === null) return <AccessMessage state="invalid" />;
  return <RoomAdminConsole scope="volunteer" />;
}
