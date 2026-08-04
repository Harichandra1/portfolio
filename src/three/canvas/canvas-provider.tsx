"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CanvasContext } from "./canvas-context";
import { useCapability } from "./use-capability";

/**
 * The WebGL canvas and everything it pulls in (three, fiber, drei) is a
 * separate chunk that is never part of the initial page load.
 */
const SharedCanvas = dynamic(
  () => import("./shared-canvas").then((m) => m.SharedCanvas),
  { ssr: false },
);

/**
 * Owns the single <Canvas> for the whole application.
 *
 * Scenes are placed in the page with <SceneView>, which portals into this one
 * canvas rather than creating its own. That means:
 *   - a browser's ~16 WebGL context limit is never a concern,
 *   - scenes survive client-side navigation without re-initialising,
 *   - moving from "hero accent" to full scroll-driven 3D needs no rewrite.
 */
export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const eventSourceRef = useRef<HTMLDivElement | null>(null);
  const capability = useCapability();
  const [viewCount, setViewCount] = useState(0);

  const registerView = useCallback(() => {
    setViewCount((n) => n + 1);
    return () => setViewCount((n) => n - 1);
  }, []);

  const value = useMemo(() => ({ capability, registerView }), [capability, registerView]);

  const active = capability.enabled && viewCount > 0;

  return (
    <CanvasContext.Provider value={value}>
      <div ref={eventSourceRef} className="relative">
        {children}

        {active ? (
          <SharedCanvas eventSource={eventSourceRef} maxDpr={capability.maxDpr} />
        ) : null}
      </div>
    </CanvasContext.Provider>
  );
}
