import type { ComponentType } from "react";
import { AgentGraphFigure } from "./agent-graph";
import { EvalGateFigure } from "./eval-gate";

export type FigureProps = { variant?: "card" | "full" };

/**
 * The figure catalogue. To add one: create the component in this directory
 * following the pattern in figure-frame.tsx (hairline strokes, mono labels,
 * exactly one accent element), then register it here.
 *
 * Not every project has a hand-drawn figure yet — `figure` in frontmatter is
 * optional, and `entry-card.tsx` / `case-study.tsx` render nothing when the
 * key is absent or unregistered rather than falling back to a placeholder.
 */
export const figureRegistry: Record<string, ComponentType<FigureProps>> = {
  "agent-graph": AgentGraphFigure,
  "eval-gate": EvalGateFigure,
};

export type FigureName = keyof typeof figureRegistry;

export function isFigureName(value: string): value is FigureName {
  return Object.hasOwn(figureRegistry, value);
}
