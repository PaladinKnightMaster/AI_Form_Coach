import { MetadataRoute } from "next";
import { getSitemapRoutes } from "@/lib/mvp/featureRegistry";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://aiformcoach.com";
  const lastModified = new Date();

  return getSitemapRoutes().map((route) => ({
    url: `${baseUrl}${route.url}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
