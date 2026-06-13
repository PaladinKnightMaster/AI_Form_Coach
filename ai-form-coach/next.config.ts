import type { NextConfig } from "next";
import { MVP_DISABLED_EXACT_PATHS, MVP_DISABLED_PREFIXES } from "./src/lib/mvp/featureRegistry";
import { withSentryConfig } from "@sentry/nextjs";

const legacyRouteRedirects = [
  ...MVP_DISABLED_EXACT_PATHS.map((source) => ({
    source,
    destination: source.startsWith("/pricing/") ? "/pricing" : "/",
    permanent: false,
  })),
  ...MVP_DISABLED_PREFIXES.map((prefix) => ({
    source: `${prefix}/:path*`,
    destination: "/",
    permanent: false,
  })),
];

const nextConfig: NextConfig = {
  // The OG / Twitter image routes read co-located font files at request time
  // (src/lib/mvp/og-fonts/*). Pin them into each route's serverless bundle so
  // next/og can rasterise the real Carriage faces in production, not just dev.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/lib/mvp/og-fonts/**"],
    "/twitter-image": ["./src/lib/mvp/og-fonts/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.pixabay.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pixabay.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  headers: async () => [
    {
      source: "/manifest.webmanifest",
      headers: [{ key: "Content-Type", value: "application/manifest+json" }],
    },
  ],
  redirects: async () => legacyRouteRedirects,
};

export default withSentryConfig(nextConfig, {
  org: "paladinknightmaster",
  project: "ai-form-coach",
  // Source-map upload (readable stack traces). Build-time secret in Vercel.
  // When unset (e.g. local/CI without the token), upload is skipped and the
  // build still succeeds.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
