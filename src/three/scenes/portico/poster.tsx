/**
 * Static fallback for the portico: an architect's elevation of the frame,
 * drawn in hairlines.
 *
 * It is what the server sends on every request and what a visitor with
 * reduced motion, no WebGL2, low memory or save-data keeps, so it draws the
 * same object rather than standing in for it: the pier with its sunk panel
 * and vine, the column with its flutes and band, both capitals' volutes,
 * and the entablature's lines.
 *
 * Three SVGs, because the 3D frame is not one shape scaled to fit. Its
 * pillars stand at the box's edges and its entablature spans whatever is
 * between them (layout.ts). So: a pier anchored left, a column anchored
 * right, both scaled by the box's height as the 3D is; and the entablature
 * as a band that stretches with `preserveAspectRatio="none"` — safe here
 * because it is only horizontal lines, and `non-scaling-stroke` keeps every
 * line a true hairline whatever the stretch.
 *
 * Units are the model's metres. y = 8.27 − z, so the drawing spans the same
 * height the camera frames (8.19 m of portico plus the scene's margins).
 * Every coordinate is a literal — this renders on the server too, where a
 * computed `Math.sin` could differ from the browser's in its last bit and
 * trip React's hydration check.
 *
 * Inline rather than an `<img>`, for the reason CONVENTIONS.md gives: it
 * reads `--scene-color-hex` and `--portico-poster-opacity` with plain CSS
 * `var()`, so it repaints the instant the theme flips.
 */

const ink = { stroke: "var(--scene-color-hex)", fill: "none" } as const;
/**
 * On every shape, not on the group: `vector-effect` does not inherit. The
 * viewBoxes are in metres, so without it a stroke of 1 is a metre wide.
 */
const hair = {
  strokeWidth: 1,
  strokeLinejoin: "round",
  strokeLinecap: "round",
  vectorEffect: "non-scaling-stroke",
} as const;

const VINE =
  "M1.395 6.97 L1.41 6.901 L1.447 6.831 L1.49 6.762 L1.504 6.693 L1.475 6.623 L1.429 6.554 L1.375 6.485 L1.326 6.415 L1.291 6.346 L1.28 6.277 L1.294 6.207 L1.33 6.138 L1.38 6.069 L1.434 5.999 L1.479 5.93 L1.506 5.861 L1.508 5.791 L1.485 5.722 L1.443 5.653 L1.39 5.583 L1.338 5.514 L1.299 5.445 L1.281 5.375 L1.288 5.306 L1.318 5.237 L1.366 5.167 L1.42 5.098 L1.468 5.029 L1.501 4.959 L1.51 4.89 L1.494 4.821 L1.456 4.751 L1.404 4.682 L1.351 4.613 L1.307 4.543 L1.283 4.474 L1.283 4.405 L1.308 4.335 L1.352 4.266 L1.405 4.197 L1.457 4.127 L1.494 4.058 L1.51 3.989 L1.5 3.919 L1.468 3.85 L1.419 3.781 L1.365 3.711 L1.318 3.642 L1.287 3.573 L1.281 3.503 L1.299 3.434 L1.339 3.365 L1.391 3.295 L1.444 3.226 L1.486 3.157 L1.508 3.087 L1.505 3.018 L1.478 2.949 L1.433 2.879 L1.379 2.81";

const SCROLLS = [
  [1.324, 6.84],
  [1.466, 6.38],
  [1.324, 5.92],
  [1.466, 5.46],
  [1.324, 5.0],
  [1.466, 4.54],
  [1.324, 4.08],
  [1.466, 3.62],
  [1.324, 3.16],
] as const;

/** Flute arrises, bottom x then top x: the shaft tapers from r 0.50 to 0.43. */
const FLUTES = [
  [0.722, 0.79],
  [0.772, 0.833],
  [0.851, 0.901],
  [0.955, 0.99],
  [1.076, 1.094],
  [1.205, 1.205],
  [1.334, 1.316],
  [1.455, 1.42],
  [1.559, 1.509],
  [1.638, 1.577],
  [1.688, 1.62],
] as const;

/** A volute: three rings narrowing on an eye. */
function Volute({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g style={ink}>
      <circle {...hair} cx={cx} cy={cy} r={r} />
      <circle {...hair} cx={cx} cy={cy} r={r * 0.62} />
      <circle {...hair} cx={cx} cy={cy} r={r * 0.3} />
      <circle {...hair} cx={cx} cy={cy} r={r * 0.1} />
    </g>
  );
}

function Pier() {
  return (
    <svg
      viewBox="0 0 2.8 8.57"
      preserveAspectRatio="xMinYMid meet"
      aria-hidden
      className="absolute inset-y-0 left-0 h-full w-auto"
    >
      <g style={ink}>
        {/* plinth and base */}
        <rect {...hair} x="0.695" y="8.05" width="1.4" height="0.22" />
        <rect {...hair} x="0.775" y="7.85" width="1.24" height="0.2" rx="0.08" />
        <rect {...hair} x="0.845" y="7.66" width="1.1" height="0.19" rx="0.05" />
        {/* shaft, and its sunk panel with the vine */}
        <rect {...hair} x="0.895" y="2.53" width="1.0" height="5.13" />
        <rect {...hair} x="1.035" y="2.69" width="0.72" height="4.77" />
        <path {...hair} d={VINE} />
        {SCROLLS.map(([x, y]) => (
          <circle {...hair} key={y} cx={x} cy={y} r="0.128" />
        ))}
        {/* capital: bell, leaves, volutes, abacus */}
        <rect {...hair} x="0.895" y="1.74" width="1.0" height="0.79" />
        <path
          {...hair}
          d="M0.98 2.47 Q1.08 2.1 1.12 2.47 M1.2 2.47 Q1.395 1.98 1.59 2.47 M1.67 2.47 Q1.71 2.1 1.81 2.47"
        />
        <rect {...hair} x="0.705" y="1.57" width="1.38" height="0.17" />
      </g>
      <g>
        <Volute cx={0.905} cy={1.96} r={0.22} />
        <Volute cx={1.885} cy={1.96} r={0.22} />
      </g>
    </svg>
  );
}

function Column() {
  return (
    <svg
      viewBox="0 0 2.8 8.57"
      preserveAspectRatio="xMaxYMid meet"
      aria-hidden
      className="absolute inset-y-0 right-0 h-full w-auto"
    >
      <g style={ink}>
        {/* plinth and Attic base */}
        <rect {...hair} x="0.505" y="8.08" width="1.4" height="0.19" />
        <rect {...hair} x="0.53" y="7.9" width="1.35" height="0.18" rx="0.09" />
        <rect {...hair} x="0.63" y="7.61" width="1.15" height="0.12" rx="0.06" />
        {/* shaft with entasis, banded */}
        <path {...hair} d="M0.705 7.55 L0.775 2.29 M1.705 7.55 L1.635 2.29" />
        <rect {...hair} x="0.67" y="5.14" width="1.07" height="0.16" rx="0.05" />
        {FLUTES.map(([b, t]) => (
          <path
            {...hair}
            key={b}
            d={`M${b} 7.48 L${(b + t) / 2} 5.2 M${(b + t) / 2} 5.06 L${t} 2.36`}
          />
        ))}
        {/* neck, echinus, abacus */}
        <rect {...hair} x="0.765" y="2.2" width="0.88" height="0.09" rx="0.04" />
        <path
          {...hair}
          d="M0.765 2.2 Q0.75 1.98 0.62 1.98 L1.79 1.98 Q1.66 1.98 1.645 2.2"
        />
        <rect {...hair} x="0.58" y="1.57" width="1.25" height="0.14" />
        <path {...hair} d="M0.565 1.71 L1.845 1.71" />
      </g>
      <g>
        <Volute cx={0.565} cy={1.98} r={0.27} />
        <Volute cx={1.845} cy={1.98} r={0.27} />
      </g>
    </svg>
  );
}

function Entablature() {
  // The moldings' heights, as y = 8.27 − z.
  const rules = [1.57, 1.44, 1.28, 1.016, 0.64, 0.59, 0.485, 0.425, 0.27, 0.08];
  return (
    <svg
      viewBox="0 0 100 8.57"
      preserveAspectRatio="none"
      aria-hidden
      className="absolute inset-0 h-full w-full"
    >
      <g style={ink}>
        {rules.map((y) => (
          <path {...hair} key={y} d={`M1 ${y} L99 ${y}`} />
        ))}
        <path {...hair} d="M1 0.08 L1 1.57 M99 0.08 L99 1.57" />
        {/* the console where walnut becomes marble */}
        <path {...hair} d="M38.6 0.27 L38.6 1.73 M41 0.27 L41 1.73 M38.6 1.73 L41 1.73" />
      </g>
    </svg>
  );
}

export function PorticoPoster({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ position: "relative", opacity: "var(--portico-poster-opacity)" }}
    >
      <Entablature />
      <Pier />
      <Column />
    </div>
  );
}
