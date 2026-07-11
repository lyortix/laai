import { ImageResponse } from "next/og";
import { getPublicRoastBySlug } from "@/lib/public/roasts";
import { displayUrl } from "@/lib/utils";

export const runtime = "nodejs";
export const alt = "LandingRoast AI audit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function scoreHex(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

/** Dynamic social share card for a public roast. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const roast = await getPublicRoastBySlug(slug);

  const site = roast ? displayUrl(roast.audit.url) : "landingroast.ai";
  const score = roast?.audit.overall_score ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0b12",
          color: "#fff",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg,#f97316,#e11d48)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            🔥
          </div>
          <span style={{ fontSize: 26, fontWeight: 600 }}>LandingRoast AI</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
            <span style={{ fontSize: 30, color: "#a1a1aa" }}>Landing page audit</span>
            <span style={{ fontSize: 60, fontWeight: 700, marginTop: 8 }}>{site}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 150, fontWeight: 800, color: scoreHex(score), lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: 26, color: "#a1a1aa" }}>/ 100</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            background: "linear-gradient(90deg,#6366f1,#a855f7,#ec4899)",
            height: 10,
            borderRadius: 6,
          }}
        />
      </div>
    ),
    size
  );
}
