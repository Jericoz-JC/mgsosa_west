"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useGame } from "@/components/game/game-provider";

export function RoomExitLink() {
  const { clearRoomHost } = useGame();
  return (
    <Link className="button button-ghost" href="/" onClick={clearRoomHost}>
      <LogOut size={16} /> Exit room console
    </Link>
  );
}
