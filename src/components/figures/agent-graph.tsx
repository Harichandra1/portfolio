import { FigureFrame, FigureNode, FigureEdge } from "./figure-frame";

const ID = "agent-graph";

/**
 * The macos-agent LangGraph: intake → {kb_retrieve, web_search} → smart_merge
 * → decide, where decide branches three ways. The web_search edge is dashed
 * and labeled with its actual gate condition — it only fires when retrieval
 * confidence is low, which is the specific design decision worth showing.
 * The `decide` node carries the one accent mark: it's the branch point that
 * makes this a graph rather than a linear RAG chain.
 */
export function AgentGraphFigure({ variant = "full" }: { variant?: "card" | "full" }) {
  return (
    <FigureFrame
      id={ID}
      variant={variant}
      title="Agent graph: intake branches to knowledge-base retrieval and a confidence-gated web search, merges, then a decide node branches to answer, clarify, or request a diagnostic."
      desc="A LangGraph state machine, not a linear chain. Intake feeds two parallel retrieval paths — the knowledge base always, and a web search only when retrieval confidence falls below a threshold. Both merge into smart_merge, which feeds the decide node. Decide is the branch point: it can answer directly, ask a clarifying question, or request a diagnostic from the user."
    >
      <FigureNode x={30} y={175} w={110} h={50} label="intake" />

      <FigureNode x={230} y={70} w={140} h={50} label="kb_retrieve" />
      <FigureNode x={230} y={280} w={140} h={50} label="web_search" />

      <FigureEdge id={ID} d="M140,190 L230,95" />
      <FigureEdge
        id={ID}
        d="M140,210 L230,300"
        dashed
        label="confidence < τ"
        labelX={175}
        labelY={265}
      />

      <FigureNode x={450} y={175} w={140} h={50} label="smart_merge" />
      <FigureEdge id={ID} d="M370,95 L450,190" />
      <FigureEdge id={ID} d="M370,300 L450,210" />

      <FigureNode x={650} y={175} w={110} h={50} label="decide" accent />
      <FigureEdge id={ID} d="M590,200 L650,200" accent />

      {/* Three outputs, drawn as short labeled stubs rather than off-canvas
          nodes — the branch itself is the point, not the destinations. */}
      <FigureEdge
        id={ID}
        d="M760,180 C 790,150 800,90 800,60"
        accent
        label="answer"
        labelX={772}
        labelY={70}
      />
      <FigureEdge
        id={ID}
        d="M760,200 L800,200"
        label="clarify"
        labelX={790}
        labelY={190}
      />
      <FigureEdge
        id={ID}
        d="M760,220 C 790,250 800,310 800,340"
        label="request diagnostic"
        labelX={735}
        labelY={355}
      />
    </FigureFrame>
  );
}
