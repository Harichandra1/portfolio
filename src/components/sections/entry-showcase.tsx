import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { EntryCard } from "./entry-card";
import type { AnyEntry } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

/**
 * A titled strip of entries with a "see all" link. Used on the home page for
 * each content type — adding a fourth type later is one more call to this.
 */
export function EntryShowcase({
  title,
  entries,
  href,
  seeAllLabel,
  columns = 2,
}: {
  title: string;
  entries: AnyEntry[];
  href: string;
  seeAllLabel: string;
  columns?: 1 | 2;
}) {
  if (entries.length === 0) return null;

  return (
    <section className="py-14">
      <Container width="wide">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="text-fg-subtle text-sm font-semibold tracking-wide uppercase">
            {title}
          </h2>
          <Link
            href={href}
            className="group text-fg-muted hover:text-fg inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            {seeAllLabel}
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </div>

        <ul className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2")}>
          {entries.map((entry) => (
            <li key={`${entry.type}/${entry.slug}`}>
              <EntryCard entry={entry} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
