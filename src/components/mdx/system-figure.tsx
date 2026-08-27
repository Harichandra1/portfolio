import { figureRegistry, isFigureName } from "@/components/figures";

/**
 * Embeds a system figure inline in a case study:
 *
 *   <SystemFigure name="eval-gate" />
 *
 * Unknown names render nothing rather than throwing, so a typo in MDX
 * frontmatter-adjacent prose degrades quietly instead of failing the build —
 * the Zod schema is what should catch real content mistakes, not this.
 */
export function SystemFigure({ name, caption }: { name: string; caption?: string }) {
  if (!isFigureName(name)) return null;
  const Figure = figureRegistry[name];

  return (
    <figure className="border-border bg-bg-subtle my-8 rounded-(--radius-lg) border p-6">
      <Figure variant="full" />
      {caption ? (
        <figcaption className="text-fg-subtle mt-3 text-center text-xs">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
