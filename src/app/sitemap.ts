import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getActiveFares, getLandingSlugs } from "@/lib/fares-db";

// Generated at /sitemap.xml. Lists public, indexable pages incl. one per active
// route/fare (the SEO landing pages). Account/auth/admin routes are excluded
// (see robots.ts).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  let routePages: MetadataRoute.Sitemap = [];
  try {
    const fares = await getActiveFares();
    routePages = fares.map((f) => ({
      url: absoluteUrl(`/routes/${f.id}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    routePages = [];
  }

  // Pretty top-level SEO landing pages (/{seoSlug}) — the primary indexable URLs.
  let landingPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getLandingSlugs();
    landingPages = slugs.map((slug) => ({
      url: absoluteUrl(`/${slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch {
    landingPages = [];
  }

  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "daily", priority: 1 },
    ...landingPages,
    ...routePages,
    { url: absoluteUrl("/privacy-policy"), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
