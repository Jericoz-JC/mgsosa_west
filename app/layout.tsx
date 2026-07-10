import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./globals.css";
import "@/components/game/game-components.css";
import { DemoGameProvider } from "@/components/game/demo-game-provider";

export const metadata: Metadata = {
  title: "MGSOSA West Game Console",
  description: "The live game-night console for MGSOSA West.",
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
        <DemoGameProvider>{children}</DemoGameProvider>
      </body>
    </html>
  );
}
