import { ArrowRight, Mail } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { SceneView } from "@/three/canvas/scene-view";
import { Sticker } from "@/components/stickers/sticker";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/*
        A contained panel, not a full-bleed band — a signature in the corner
        rather than a particle backdrop behind the copy. It never competes
        with the text: the scene reads its own ink-toned --scene-* tokens
        (see globals.css), not --accent, and fades to nothing toward the
        text side via the mask below rather than a hard box edge.

        Note: CSS opacity on this wrapper would not dim the scene — the 3D
        paints on the shared canvas, not by this DOM element. Adjust
        intensity via --scene-opacity in globals.css or the shader itself.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-full max-w-[16rem] sm:max-w-[22rem] md:max-w-[28rem]"
        style={{
          maskImage: "linear-gradient(to left, black 45%, transparent 92%)",
          WebkitMaskImage: "linear-gradient(to left, black 45%, transparent 92%)",
        }}
      >
        <SceneView name="hero" />
      </div>

      <Container width="wide" className="relative py-16 sm:py-24 lg:py-32">
        {/*
          The one sticker on a page that has to be believed. Wordless on
          purpose — the hero already asks for a headline, a paragraph and
          three buttons to be read, and a text sticker would be a fourth
          thing competing for the first two seconds. It sits in the gap
          between the copy (max-w-lg) and the scene panel, so it crowds
          neither.
        */}
        <Sticker
          name="chai"
          className="bottom-32 left-[56%] hidden w-20 -rotate-[12deg] lg:block xl:left-[50%]"
        />

        <p className="text-fg-subtle font-mono text-xs tracking-wide uppercase">
          {siteConfig.role} · {siteConfig.location}
        </p>

        <h1 className="font-display text-fg mt-5 max-w-2xl text-5xl text-balance sm:text-6xl">
          {siteConfig.positioning}
        </h1>

        <p className="text-fg-muted mt-6 max-w-lg text-lg text-pretty">
          Founding engineer at Metry AI, where I own the backend architecture and REST
          APIs behind SOJO — a client-management platform for beauty and wellness
          businesses across Asia. Outside work I build agent systems and the evaluation
          harnesses that tell me whether they actually work.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <ButtonLink href="#work">
            View work
            <ArrowRight aria-hidden />
          </ButtonLink>
          <ButtonLink href={`mailto:${siteConfig.email}`} variant="outline">
            <Mail aria-hidden />
            Get in touch
          </ButtonLink>
          {siteConfig.resumePath ? (
            <ButtonLink
              href={siteConfig.resumePath}
              variant="ghost"
              size="sm"
              target="_blank"
              className="font-mono text-xs tracking-wide uppercase"
            >
              Résumé — PDF
            </ButtonLink>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
