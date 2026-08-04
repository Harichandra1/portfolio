import { SceneView } from "@/three/canvas/scene-view";
import type { SceneName } from "@/three/scenes/names";

/**
 * Embeds a registered 3D scene inline in a post or project write-up:
 *
 *   <Scene name="hero" caption="The lattice, live." />
 *
 * Degrades to the scene's poster image exactly like anywhere else.
 */
export function Scene({
  name,
  caption,
  aspect = "16 / 9",
}: {
  name: SceneName;
  caption?: string;
  aspect?: string;
}) {
  return (
    <figure className="my-8">
      <div
        className="border-border bg-bg-subtle overflow-hidden rounded-lg border"
        style={{ aspectRatio: aspect }}
      >
        <SceneView name={name} />
      </div>
      {caption ? (
        <figcaption className="text-fg-subtle mt-2 text-center text-xs">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
