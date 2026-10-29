import type { Metadata } from "next";
import "@/components/game/game-components.css";
import { GameProvider } from "@/components/game/game-provider";

export const metadata: Metadata = {
  title: "Game Mode",
  robots: { index: false },
};

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <GameProvider>{children}</GameProvider>;
}
