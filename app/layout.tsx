import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex/convex-client-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://mgsosawest.com"),
  title: {
    default: "MGSOSA West • Syriac Orthodox youth of the Western Region",
    template: "%s • MGSOSA West",
  },
  description:
    "MGSOSA West brings together Syriac Orthodox youth from nine parishes across the Western Region for Bible studies, conferences, service, and game nights.",
  icons: {
    icon: [{ url: "/brand/mgsosa-mark-transparent.png", type: "image/png" }],
    shortcut: "/brand/mgsosa-mark-transparent.png",
    apple: "/brand/mgsosa-mark-navy.png",
  },
  openGraph: {
    siteName: "MGSOSA West",
    images: [{ url: "/brand/mgsosa-west-badge.jpg" }],
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
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
