import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo";

// Dynamically generated social share card (1200×630). Served at
// /opengraph-image and automatically wired into <meta property="og:image">.
// Edge-friendly: pure JSX rendered to a PNG, no external assets required.

export const alt = `${SITE.name} — Banff, Lake Louise & Moraine Lake Shuttle Service`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #14301f 0%, #1f3d2b 55%, #2c5338 100%)",
          padding: "72px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#f6c453",
          }}
        >
          {SITE.name}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: "920px",
            }}
          >
            Banff · Lake Louise · Moraine Lake
          </div>
          <div style={{ fontSize: 34, color: "#d7e4da", maxWidth: "880px" }}>
            Premium daily shuttle service. Book the 4:30 AM Sunrise Express or a Daytime Circuit seat.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 28,
            color: "#f6c453",
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 9999,
              background: "#f6c453",
              display: "flex",
            }}
          />
          {SITE.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    ),
    { ...size },
  );
}
