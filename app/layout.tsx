import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./globals.css";
import "@/components/game/game-components.css";
import { GameProvider } from "@/components/game/game-provider";

export const metadata: Metadata = {
  title: "MGSOSA West Game Console",
  description: "The live game-night console for MGSOSA West.",
  icons: {
    icon: [{ url: "/brand/mgsosa-mark-transparent.png", type: "image/png" }],
    shortcut: "/brand/mgsosa-mark-transparent.png",
    apple: "/brand/mgsosa-mark-navy.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08233f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
