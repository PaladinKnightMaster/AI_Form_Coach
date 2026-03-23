import type { NextConfig } from "next";
import { MVP_DISABLED_EXACT_PATHS, MVP_DISABLED_PREFIXES } from "./src/lib/mvp/featureRegistry";

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

export default nextConfig;