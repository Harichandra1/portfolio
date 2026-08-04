"use client";

import { createContext, useContext } from "react";
import type { Capability } from "./capability";

export type CanvasContextValue = {
  /** Always disabled on the server; the real value arrives after hydration. */
  capability: Capability;
  /**
   * Called by every mounted <SceneView>. The shared <Canvas> only exists while
   * at least one view is registered, so routes without 3D create no WebGL
   * context at all. Returns the unregister function.
   */
  registerView: () => () => void;
};

export const CanvasContext = createContext<CanvasContextValue | null>(null);

export function useCanvasContext() {
  const ctx = useContext(CanvasContext);
  if (!ctx) {
    throw new Error("useCanvasContext must be used inside <CanvasProvider>.");
  }
  return ctx;
}
