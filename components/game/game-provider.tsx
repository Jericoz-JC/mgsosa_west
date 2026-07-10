"use client";

import { ConvexGameProvider } from "./convex-game-provider";
import { DemoGameProvider } from "./demo-game-provider";

export { useGame } from "./game-context";

// Inlined at build time. When a Convex deployment URL is configured the app
// runs against hosted realtime state; otherwise it falls back to the local
// synchronized demo so the UI stays explorable without a backend.
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

export function GameProvider({ children }: { children: React.ReactNode }) {
  if (CONVEX_URL) return <ConvexGameProvider url={CONVEX_URL}>{children}</ConvexGameProvider>;
  return <DemoGameProvider>{children}</DemoGameProvider>;
}
