import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The site-wide social card, generated at request time.
 *
 * Only a small subset of CSS works here (flexbox, no grid, explicit `display`
 * on every div). Copy this file into a route folder to give that route its own
 * card — Next picks it up automatically.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        backgroundColor: "#0d0c0a",
        backgroundImage:
          "radial-gradient(circle at 78% 12%, rgba(243,151,98,0.22) 0%, rgba(13,12,10,0) 55%)",
        color: "#f6f4f2",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 24,
          color: "#f39762",
          fontFamily: "monospace",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {siteConfig.role}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{ display: "flex", fontSize: 76, fontWeight: 600, letterSpacing: -2 }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#b5b0aa",
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          {siteConfig.positioning}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 22,
          color: "#8a857e",
          fontFamily: "monospace",
        }}
      >
        {siteConfig.links.github.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      </div>
    </div>,
    size,
  );
}
