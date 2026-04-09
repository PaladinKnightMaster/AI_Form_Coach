import type { Metadata, Viewport } from "next";
import Script from "next/script";
import LogSilencer from "@/components/LogSilencer";
import { ToastProvider } from "@/components/ToastProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const description = "Private, browser-based motion coaching for squat, pushup, and plank. No video uploads during live coaching.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "AI Form Coach - Private Motion Coaching in Your Browser",
    template: "%s - AI Form Coach",
  },
  description,
  keywords: ["AI fitness coach", "form coach", "pose detection", "browser coaching", "privacy-first fitness"],
  authors: [{ name: "AI Form Coach" }],
  creator: "AI Form Coach",
  publisher: "AI Form Coach",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://aiformcoach.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "AI Form Coach",
    title: "AI Form Coach - Private Motion Coaching in Your Browser",
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AI Form Coach - private motion coaching in your browser",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@aiformcoach",
    creator: "@aiformcoach",
    title: "AI Form Coach - Private Motion Coaching in Your Browser",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#111827" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="flex min-h-screen flex-col antialiased" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('afc_theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.classList.add(t);document.documentElement.dataset.theme=t}catch(e){}})()`,
          }}
        />
        <AuthProvider>
          <ToastProvider>
            {children}
            <LogSilencer />
          </ToastProvider>
        </AuthProvider>
        {umamiWebsiteId ? <Script async defer src={umamiSrc} data-website-id={umamiWebsiteId} /> : null}
      </body>
    </html>
  );
}