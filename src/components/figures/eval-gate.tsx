import { FigureFrame, FigureNode, FigureEdge } from "./figure-frame";

const ID = "eval-gate";

/**
 * The macos-agent eval harness: candidate → eval suite → two blind judges →
 * a score compared against a committed baseline → a gate that either lets a
 * deploy through or blocks it. The BLOCKED path carries the one accent mark
 * — this is the artifact that makes the eval harness a differentiator rather
 * than a metrics dashboard: a bad score stops a deploy automatically.
 */
export function EvalGateFigure({ variant = "full" }: { variant?: "card" | "full" }) {
  return (
    <FigureFrame
      id={ID}
      variant={variant}
      title="Eval gate: a candidate build runs an eval suite, is scored blind by two judge models, compared against a committed baseline, then a gate either deploys it or blocks the deploy."
      desc="regression_gate.py in the macos-agent repo. A candidate build runs the eval suite; two judge models score it blind, without seeing each other's scores; the result is compared against a committed baseline.json. If the score falls below baseline, the gate blocks the deploy outright rather than merely warning."
    >
      <FigureNode x={20} y={175} w={110} h={50} label="candidate" />
      <FigureEdge id={ID} d="M130,200 L200,200" />

      <FigureNode x={200} y={175} w={130} h={50} label="eval suite" />
      <FigureEdge id={ID} d="M330,190 L390,120" />
      <FigureEdge id={ID} d="M330,210 L390,280" />

      <FigureNode x={390} y={95} w={110} h={50} label="judge A" sublabel="blind" />
      <FigureNode x={390} y={255} w={110} h={50} label="judge B" sublabel="blind" />

      <FigureEdge id={ID} d="M500,120 L560,190" />
      <FigureEdge id={ID} d="M500,280 L560,210" />

      <FigureNode
        x={560}
        y={165}
        w={150}
        h={70}
        label="score vs"
        sublabel="baseline.json"
      />

      <path
        d="M710,190 L740,140 L760,140"
        fill="none"
        style={{ stroke: "var(--border-strong)", strokeWidth: 1 }}
        markerEnd={`url(#${ID}-arrow)`}
      />
      <text
        x={795}
        y={130}
        textAnchor="end"
        className="font-mono text-[13px]"
        style={{ fill: "var(--fg)" }}
      >
        deploy
      </text>

      <path
        d="M710,210 L740,270 L760,270"
        fill="none"
        style={{ stroke: "var(--accent)", strokeWidth: 1.25 }}
        markerEnd={`url(#${ID}-arrow-accent)`}
      />
      <text
        x={795}
        y={260}
        textAnchor="end"
        className="font-mono text-[13px] font-semibold"
        style={{ fill: "var(--accent)" }}
      >
        BLOCKED
      </text>
      <text
        x={795}
        y={280}
        textAnchor="end"
        className="font-mono text-[10px] tracking-wide uppercase"
        style={{ fill: "var(--fg-subtle)" }}
      >
        score below baseline
      </text>
    </FigureFrame>
  );
}
