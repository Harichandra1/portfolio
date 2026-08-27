"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useCanvasContext } from "./canvas-context";
import { SceneBoundary } from "./scene-boundary";
import { sceneRegistry } from "@/three/scenes/registry";
import type { SceneName } from "@/three/scenes/names";

const ViewSlot = dynamic(() => import("./view-bridge").then((m) => m.ViewSlot), {
  ssr: false,
});

type SceneViewProps = {
  name: SceneName;
  className?: string;
};

/**
 * Drops a 3D scene into the page.
 *
 * On the server and on any device that fails the capability gate, this renders
 * only the scene's poster — no three.js is downloaded and no WebGL context is
 * created. When 3D is available it claims this rectangle of the shared canvas
 * and renders the scene into it.
 */
export function SceneView({ name, className }: SceneViewProps) {
  const { capability, registerView } = useCanvasContext();
  const entry = sceneRegistry[name];
  const enabled = capability.enabled;

  // Registering is what brings the shared canvas into existence.
  useEffect(() => {
    if (!enabled) return;
    return registerView();
  }, [enabled, registerView]);

  const fallback = (
    <div role="img" aria-label={entry.alt} className={cn("size-full", className)}>
      <entry.Poster className="size-full" />
    </div>
  );

  if (!enabled) return fallback;

  return (
    <SceneBoundary fallback={fallback}>
      <ViewSlot className={cn("size-full", className)}>
        <entry.Component />
      </ViewSlot>
    </SceneBoundary>
  );
}
