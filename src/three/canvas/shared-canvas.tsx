"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, Preload } from "@react-three/drei";
import { ViewPort } from "./view-bridge";

/**
 * The one and only <Canvas>. Fixed to the viewport, sitting behind all content
 * and transparent to pointer events — every visible pixel comes from a
 * <SceneView> scissoring its own rectangle out of this surface.
 */
export function SharedCanvas({
  eventSource,
  maxDpr,
}: {
  eventSource: React.RefObject<HTMLElement | null>;
  maxDpr: number;
}) {
  const [dpr, setDpr] = useState(Math.min(maxDpr, 1.5));

  return (
    <Canvas
      // `client` coordinates are what <View> expects when the canvas is fixed.
      eventPrefix="client"
      eventSource={eventSource as React.RefObject<HTMLElement>}
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      // Nothing renders until a View claims a region, so a transparent clear is
      // all that's needed here.
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        pointerEvents: "none",
        // Behind all page content. The wrapper in CanvasProvider is `relative`
        // with no z-index, so it doesn't create a stacking context and this
        // stays below the content while remaining above the page background.
        zIndex: -1,
      }}
    >
      {/* Drop resolution rather than frame rate when the GPU struggles. */}
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        onIncline={() => setDpr(Math.min(maxDpr, 1.5))}
      />
      <ViewPort />
      <Preload all />
    </Canvas>
  );
}
