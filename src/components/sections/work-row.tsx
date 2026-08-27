import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Entry } from "@/lib/content/schema";
import { figureRegistry, isFigureName } from "@/components/figures";

/**
 * A single hairline row in Selected Work — deliberately not a card. Depth
 * comes from the border between rows, not a box around each one; see
 * CONVENTIONS.md's "hairline rows, not a card grid" rule.
 */
export function WorkRow({ entry, index }: { entry: Entry<"projects">; index: number }) {
  const fm = entry.frontmatter;
  const Figure = fm.figure && isFigureName(fm.figure) ? figureRegistry[fm.figure] : null;
  const stackLine = [fm.role, fm.stack.slice(0, 4).join(" · ")]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="group border-border reveal relative border-b py-8 first:border-t">
      <Link
        href={entry.href}
        className="absolute inset-0 before:absolute before:inset-0"
        aria-label={fm.title}
      />

      <div className="grid gap-5 md:grid-cols-[2.5rem_1fr_auto] md:items-center md:gap-8">
        <span className="text-fg-subtle hidden font-mono text-sm tabular-nums md:block">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="font-display group-hover:text-accent text-fg text-2xl transition-colors">
              {fm.title}
            </h3>
            {fm.kind === "case-study" ? (
              <span className="text-accent text-2xs font-mono tracking-wide uppercase">
                Case study
              </span>
            ) : null}
            <ArrowUpRight
              className="text-fg-subtle size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </div>

          <p className="text-fg-muted mt-2 text-sm">{fm.outcome ?? fm.summary}</p>

          {stackLine ? (
            <p className="text-fg-subtle text-2xs mt-2 font-mono tracking-wide uppercase">
              {stackLine}
            </p>
          ) : null}
        </div>

        {Figure ? (
          <div className="relative z-10 hidden w-[220px] shrink-0 lg:block">
            <Figure variant="card" />
          </div>
        ) : null}
      </div>
    </li>
  );
}
