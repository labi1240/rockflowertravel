import type { MetadataRoute } from "next";
import { SITE, absoluteUrl } from "@/lib/seo";

// Generated at /robots.txt. Crawlers may index public marketing pages; private
// areas (account, auth, admin, API) are disallowed so they never surface in
// search results or waste crawl budget.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/my-trips", "/sign-in", "/sign-up", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE.url,
  };
}
