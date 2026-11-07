/**
 * Static fallback for a rail: two hairlines, the rail's edges, running the
 * length of the page. Nothing more — the rails are a continuation of the
 * portico, and without the 3D they should stay as quiet as a margin rule.
 * Inline, reading --scene-color-hex, for the reason CONVENTIONS.md gives.
 */
export function RailPoster({ className }: { className?: string }) {
  return (
    <div className={className} style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: "23%",
          height: "100%",
          borderLeft: "1px solid var(--scene-color-hex)",
          borderRight: "1px solid var(--scene-color-hex)",
          opacity: "var(--portico-poster-opacity)",
        }}
      />
    </div>
  );
}
