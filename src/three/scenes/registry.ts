"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { SceneName } from "./names";
import { HeroPoster } from "./hero/poster";

/**
 * The catalogue of 3D scenes.
 *
 * To add a scene:
 *   1. create `src/three/scenes/<name>/index.tsx` with a default export
 *      containing only three.js elements (no DOM),
 *   2. create `src/three/scenes/<name>/poster.tsx` — an inline SVG fallback
 *      reading the same design tokens the scene does (see hero/poster.tsx
 *      for the pattern; this is what ships when 3D is unavailable, and what
 *      the server always sends),
 *   3. add the name to `names.ts`, then an entry here.
 *
 * Anything can then render it with `<SceneView name="<name>" />`, and MDX
 * frontmatter can reference it by that same name via the `scene:` field.
 */
export type SceneEntry = {
  Component: ComponentType;
  /** Static visual shown when 3D is unavailable, disabled, or has errored. */
  Poster: ComponentType<{ className?: string }>;
  /** Accessible label for the poster — describe the visual, not the technology. */
  alt: string;
};

// Typed as a full Record, so adding a name to names.ts without an entry here
// is a compile error rather than a runtime crash.
export const sceneRegistry: Record<SceneName, SceneEntry> = {
  hero: {
    Component: dynamic(() => import("./hero"), { ssr: false }),
    Poster: HeroPoster,
    alt: "A quiet lattice of points rippling across a surface",
  },
};

export type { SceneName };
