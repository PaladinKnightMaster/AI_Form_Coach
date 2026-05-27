import type { Metadata, Viewport } from "next";
import Script from "next/script";
import LogSilencer from "@/components/LogSilencer";
import RibbonCSplash from "@/components/RibbonCSplash";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

/* ─────────────────────────────────────────────────────────────────────────
 * Carriage root layout.
 *
 * Step 02 dropped Inter, added font-preload hints.
 * Step 05 rewrote metadata to the Carriage voice.
 * Step 06 wired the favicon + Apple touch icon + manifest via file-based
 *         metadata (src/app/icon.svg, src/app/apple-icon.tsx).
 * Step 07 (this revision) mounts the signature splash. RibbonCSplash is
 *         a client component; it self-gates on sessionStorage so the
 *         reveal plays at most once per browser tab.
 * ──────────────────────────────────────────────────────────────────────── */

const description =
  "AI Form Coach watches your squat, pushup, and plank — and gives you the cues a good teacher would. Your video stays on your device.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070707",
};

export const metadata: Metadata = {
  title: {
    default: "Carriage — AI Form Coach · Return to your line.",
    template: "%s · Carriage",
  },
  description,
  keywords: [
    "motion coaching",
    "form coach",
    "pose detection",
    "browser coaching",
    "on-device",
    "Carriage",
  ],
  authors: [{ name: "Carriage" }],
  creator: "Carriage",
  publisher: "Carriage",
  applicationName: "Carriage",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://aiformcoach.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Carriage",
    title: "Carriage — Return to your line.",
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Carriage — Return to your line.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@aiformcoach",
    creator: "@aiformcoach",
    title: "Carriage — Return to your line.",
    description,
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC || "https://analytics.umami.is/script.js";

  return (
    <html lang="en" className="dark" data-theme="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        {/* Carriage v2 — obsidian theme. */}
        <meta name="theme-color" content="#070707" />
        {/* Preload the two faces that paint above-the-fold copy.
            Variable fonts mean one file each — keeps preloads cheap. */}
        <link
          rel="preload"
          href="/fonts/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Fraunces/Fraunces-Italic-VariableFont_SOFT%2CWONK%2Copsz%2Cwght.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased text-white font-sans" suppressHydrationWarning>

        <AuthProvider>
          <ToastProvider>
            {/* Signature splash — gates itself per browser tab; renders
                nothing on subsequent loads. Mounted at the very top of the
                tree so it sits above SiteHeader, Coach chrome, modals. */}
            <RibbonCSplash />
            {children}
            <LogSilencer />
          </ToastProvider>
        </AuthProvider>
        {umamiWebsiteId ? <Script async defer src={umamiSrc} data-website-id={umamiWebsiteId} /> : null}
      </body>
    </html>
  );
}
