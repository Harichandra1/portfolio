import { Container } from "@/components/ui/container";
import { claimTally } from "@content/data/claims";

/**
 * Explains the claim markers. The tally is computed from the registry rather
 * than written by hand — a number about honesty that could silently go stale
 * would be a poor advertisement for the idea.
 */
export function ReceiptsNote() {
  const { total, checkable, selfReported } = claimTally();

  return (
    <section className="border-border border-t py-20">
      <Container width="prose">
        <h2 className="text-fg-subtle font-mono text-xs tracking-wide uppercase">
          About the <span className="text-accent">✓</span> marks
        </h2>

        <p className="text-fg-muted mt-6 text-lg">
          Claims on this site carry a receipt. Click one and you get what backs it and a
          link to the exact file, so you can check me instead of taking my word for it.
        </p>

        <p className="text-fg-muted mt-4">
          There are <span className="text-fg font-medium">{total}</span> of them.{" "}
          <span className="text-fg font-medium">{checkable}</span> point at code,
          committed benchmark data, or something running. The other{" "}
          <span className="text-fg font-medium">{selfReported}</span> come from private
          work and link nowhere — those are marked{" "}
          <span className="text-fg-subtle font-mono">—</span> instead of{" "}
          <span className="text-accent font-mono">✓</span>, because a claim you
          can&rsquo;t check should not look like one you can.
        </p>

        <p className="text-fg-muted mt-4">
          A script enforces it. It fails the build on unbacked superlatives, on a
          benchmark percentage without its sample size, and on any claim that says
          it&rsquo;s checkable but links nowhere. It&rsquo;s the same idea as the
          regression gate on my macOS agent, pointed at my own writing instead of a model.
        </p>
      </Container>
    </section>
  );
}
