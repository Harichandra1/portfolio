import { cn } from "@/lib/utils";

/**
 * Shared chrome for every system figure: hairline strokes in --border-strong,
 * mono labels in --fg-subtle, no fills except the one accent element each
 * figure is allowed, no gradients, no drop shadows. `role="img"` plus a real
 * `<title>`/`<desc>` pair — these are content, not decoration, so they need
 * to be readable by assistive tech, not just hidden.
 *
 * All figures share one 800×400 coordinate space regardless of `variant` —
 * only the rendered size changes, via CSS, so a figure never needs two
 * different internal layouts.
 */
export function FigureFrame({
  id,
  title,
  desc,
  variant = "full",
  className,
  children,
}: {
  id: string;
  title: string;
  desc: string;
  variant?: "card" | "full";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 800 400"
      role="img"
      aria-labelledby={`${id}-title ${id}-desc`}
      className={cn(
        "h-auto w-full",
        variant === "card" ? "max-h-[120px]" : "max-h-[340px]",
        className,
      )}
    >
      <title id={`${id}-title`}>{title}</title>
      <desc id={`${id}-desc`}>{desc}</desc>
      <defs>
        <marker
          id={`${id}-arrow`}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8 z" style={{ fill: "var(--border-strong)" }} />
        </marker>
        <marker
          id={`${id}-arrow-accent`}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8 z" style={{ fill: "var(--accent)" }} />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

/** A node: hairline rect + centered mono label. */
export function FigureNode({
  x,
  y,
  w,
  h,
  label,
  sublabel,
  accent = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={3}
        style={{
          fill: accent ? "var(--color-accent-subtle)" : "var(--bg)",
          stroke: accent ? "var(--accent)" : "var(--border-strong)",
          strokeWidth: 1,
        }}
      />
      <text
        x={x + w / 2}
        y={y + h / 2 + (sublabel ? -4 : 0)}
        textAnchor="middle"
        dominantBaseline="middle"
        className="font-mono text-[13px]"
        style={{ fill: accent ? "var(--accent)" : "var(--fg)" }}
      >
        {label}
      </text>
      {sublabel ? (
        <text
          x={x + w / 2}
          y={y + h / 2 + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-mono text-[10px] tracking-wide uppercase"
          style={{ fill: "var(--fg-subtle)" }}
        >
          {sublabel}
        </text>
      ) : null}
    </g>
  );
}

/** An edge: a straight or elbowed hairline path with an arrowhead. Give
 *  `labelX`/`labelY` explicitly rather than deriving them from `d` — simpler
 *  and correct for both straight and elbowed paths. */
export function FigureEdge({
  id,
  d,
  label,
  labelX,
  labelY,
  dashed = false,
  accent = false,
}: {
  id: string;
  d: string;
  label?: string;
  labelX?: number;
  labelY?: number;
  dashed?: boolean;
  accent?: boolean;
}) {
  return (
    <g>
      <path
        d={d}
        fill="none"
        style={{
          stroke: accent ? "var(--accent)" : "var(--border-strong)",
          strokeWidth: 1,
          strokeDasharray: dashed ? "3 3" : undefined,
        }}
        markerEnd={`url(#${id}-${accent ? "arrow-accent" : "arrow"})`}
      />
      {label && labelX !== undefined && labelY !== undefined ? (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          className="font-mono text-[10px] tracking-wide uppercase"
          style={{ fill: accent ? "var(--accent)" : "var(--fg-subtle)" }}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
