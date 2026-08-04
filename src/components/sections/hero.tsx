import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SceneView } from "@/three/canvas/scene-view";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* The scene sits behind the copy and is purely decorative — the text
          remains readable if it never loads.

          Note: CSS opacity on this wrapper would not dim the scene. The 3D is
          painted on the shared canvas, not by this element — only the poster
          fallback and the gradient below are actually DOM. Adjust scene
          intensity in the shader instead. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem]" aria-hidden>
        <SceneView name="hero" />
        {/* Fades the scene into the page background at its lower edge. This one
            does work on the canvas: it paints above it in normal flow. */}
        <div className="to-bg absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent" />
      </div>

      <Container width="wide" className="relative py-24 sm:py-32">
        <p className="text-accent font-mono text-sm">{siteConfig.role}</p>

        <h1 className="text-fg mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {siteConfig.tagline}
        </h1>

        <p className="text-fg-muted mt-5 max-w-lg text-pretty">
          {siteConfig.description}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/projects">
            See the work
            <ArrowRight aria-hidden />
          </ButtonLink>
          <ButtonLink href="/about" variant="outline">
            About me
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
