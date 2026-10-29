"use client";

import { useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Inlined at build time. Without a deployment URL the site and Game Mode run
// on local demo state, so no Convex client is created.
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

export const hasConvex = Boolean(CONVEX_URL);

/**
 * One realtime client for the whole app. Creating it opens no subscriptions,
 * so public pages that never query Convex stay as light as static pages.
 */
export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => (CONVEX_URL ? new ConvexReactClient(CONVEX_URL) : null));
  if (!client) return <>{children}</>;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
