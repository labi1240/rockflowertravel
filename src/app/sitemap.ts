import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Generated at /sitemap.xml. Lists only public, indexable pages. Account/auth/
// admin routes are deliberately excluded (see robots.ts). `lastModified` uses
// build time, which is sufficient for a small, mostly-static marketing site.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/privacy-policy"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
