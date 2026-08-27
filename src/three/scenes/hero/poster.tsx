/**
 * Static fallback for the hero scene — rendered when 3D is disabled,
 * unavailable, or has errored, and always what the server sends.
 *
 * An inline component rather than an `<img src>` pointing at a static SVG
 * asset on purpose: it reads the same `--scene-color-hex` / `--scene-opacity`
 * CSS custom properties the live scene does, so it repaints instantly when
 * `next-themes` flips the `.dark` class — no `@media` query inside a static
 * asset to desync from a class-based theme toggle, and no JS needed either,
 * since CSS custom properties just cascade.
 */
const COLS = 14;
const ROWS = 9;

function hash(n: number) {
  const x = Math.sin(n * 91.3) * 21563.75;
  return x - Math.floor(x);
}

// Trig functions can differ in their last bit between Node's V8 (server) and
// the browser's V8 (client) — same expression, occasionally a different
// float. Rounding every rendered coordinate to a fixed precision guarantees
// the server and client markup strings are byte-identical, which is what
// React's hydration check actually compares. Four decimals is far more
// precision than a ~1-100 unit viewBox needs.
function round(n: number) {
  return Math.round(n * 10000) / 10000;
}

export function HeroPoster({ className }: { className?: string }) {
  const dots = [];
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      const u = x / (COLS - 1);
      const v = y / (ROWS - 1);
      const wave = Math.sin(u * 6.2) * Math.cos(v * 5.1);
      const cy = v * 100 + wave * 6;
      const r = 0.9 + Math.abs(wave) * 0.7 + hash(x * ROWS + y) * 0.2;
      dots.push(
        <circle
          key={`${x}-${y}`}
          cx={round(u * 100)}
          cy={round(cy)}
          r={round(r)}
          style={{ fill: "var(--scene-color-hex)" }}
        />,
      );
    }
  }

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      className={className}
      style={{ opacity: "var(--scene-opacity)" }}
    >
      {dots}
    </svg>
  );
}
