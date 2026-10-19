import { FigureFrame, FigureNode, FigureEdge } from "./figure-frame";

const ID = "harness-loop";

/**
 * The coding-agent harness: an issue goes to a planner that writes a short
 * step plan, then a ReAct loop runs read/write/edit/bash until it stops
 * calling tools, and the diff becomes the submitted patch.
 *
 * The one accent element is the sandbox boundary. That's the actually
 * interesting part of this design — every command the agent runs executes in
 * a per-run container with no network and a path-jailed workspace, so the
 * agent cannot reach the internet, the host, or anything outside the repo it
 * was given. The loop is ordinary; the box around it is the decision.
 */
export function HarnessLoopFigure({ variant = "full" }: { variant?: "card" | "full" }) {
  return (
    <FigureFrame
      id={ID}
      variant={variant}
      title="Coding-agent harness: an issue goes to a planner, then a ReAct loop calls read, write, edit and bash tools inside a network-disabled Docker sandbox, and the resulting diff is submitted as a patch."
      desc="A GitHub issue is passed to a planner node that writes a short step plan. A ReAct loop then alternates between model turns and tool calls, under a hard cap on the number of LLM calls. Every tool runs inside a per-run Docker container built from the instance's own image, with networking disabled and the workspace path-jailed, so file writes and shell commands cannot escape the repository. When the model stops calling tools, the working-tree diff is submitted as the patch."
    >
      <FigureNode x={16} y={174} w={96} h={52} label="issue" />
      <FigureEdge id={ID} d="M112,200 L142,200" />

      <FigureNode x={142} y={174} w={120} h={52} label="planner" sublabel="step plan" />
      <FigureEdge id={ID} d="M262,200 L300,200" />

      <FigureNode
        x={300}
        y={160}
        w={140}
        h={80}
        label="agent loop"
        sublabel="llm-call cap"
      />

      {/* The sandbox — the figure's one accent element. */}
      <rect
        x={500}
        y={80}
        width={250}
        height={240}
        rx={3}
        style={{
          fill: "var(--color-accent-subtle)",
          stroke: "var(--accent)",
          strokeWidth: 1,
          strokeDasharray: "4 3",
        }}
      />
      <text
        x={625}
        y={70}
        textAnchor="middle"
        className="font-mono text-[10px] tracking-wide uppercase"
        style={{ fill: "var(--accent)" }}
      >
        docker · network: none
      </text>

      <FigureNode x={524} y={110} w={202} h={52} label="read · write · edit" />
      <FigureNode x={524} y={190} w={202} h={52} label="bash" sublabel="repo image" />

      <text
        x={625}
        y={290}
        textAnchor="middle"
        className="font-mono text-[10px] tracking-wide uppercase"
        style={{ fill: "var(--fg-subtle)" }}
      >
        path-jailed workspace
      </text>

      <FigureEdge
        id={ID}
        d="M440,180 L500,146"
        label="tool call"
        labelX={472}
        labelY={148}
      />
      <FigureEdge
        id={ID}
        d="M500,236 L440,220"
        label="observation"
        labelX={474}
        labelY={252}
        dashed
      />

      <FigureEdge
        id={ID}
        d="M370,240 L370,308"
        label="on finish"
        labelX={430}
        labelY={278}
      />
      <FigureNode x={300} y={308} w={140} h={52} label="patch" sublabel="diff only" />
    </FigureFrame>
  );
}
