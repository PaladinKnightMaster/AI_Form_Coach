import { MetadataRoute } from "next";
import { getRobotsDisallowPaths } from "@/lib/mvp/featureRegistry";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://aiformcoach.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: getRobotsDisallowPaths(),
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
