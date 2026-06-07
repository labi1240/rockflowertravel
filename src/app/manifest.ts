import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

// Web App Manifest, served at /manifest.webmanifest. Enables installable PWA
// behaviour and richer mobile presentation. Icons reference the existing logo;
// swap in dedicated maskable/sized icons before a formal PWA launch.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — Banff, Lake Louise & Moraine Lake Shuttle`,
    short_name: SITE.name,
    description: SITE.shortDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f3d2b",
    icons: [
      {
        src: "/main_logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
