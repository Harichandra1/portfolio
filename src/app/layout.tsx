import type { Metadata, Viewport } from "next";
import { Caveat, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { siteConfig, siteUrl } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CanvasProvider } from "@/three/canvas/canvas-provider";

import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans-var", display: "swap" });
const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono-var",
  display: "swap",
});
// Weight 400 only (all the family ships) — the display voice: hero H1, page
// H1s, section display lines, the eval-lessons pull-quote. Never body copy.
// The marker hand — sticker labels and margin notes only, never body copy
// or anything load-bearing. See CONVENTIONS.md.
const hand = Caveat({
  subsets: ["latin"],
  variable: "--font-hand-var",
  display: "swap",
});
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display-var",
  display: "swap",
});

export const metadata: Metadata = {
  ...buildMetadata(),
  title: {
    default: `${siteConfig.name} — ${siteConfig.role}`,
    // A child page setting `title: "Projects"` renders "Projects · Name".
    template: `%s · ${siteConfig.name}`,
  },
  authors: [{ name: siteConfig.name, url: siteUrl }],
  creator: siteConfig.name,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${siteUrl}/rss.xml` },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0c0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} ${display.variable} ${hand.variable}`}
    >
      <body className="min-h-dvh">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only-focusable bg-accent text-accent-fg absolute top-3 left-3 z-100 rounded-md px-3 py-2 text-sm"
          >
            Skip to content
          </a>

          {/*
            CanvasProvider owns the single shared WebGL canvas that sits behind
            all content. It stays inert until a page actually requests a scene
            through <SceneView>, so pages with no 3D pay nothing for it.
          */}
          <CanvasProvider>
            <div className="flex min-h-dvh flex-col">
              <Header />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </CanvasProvider>
        </ThemeProvider>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
