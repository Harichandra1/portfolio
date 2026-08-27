import Link from "next/link";
import { Container } from "@/components/ui/container";
import { EntryCard } from "./entry-card";
import { SectionHeading } from "./section";
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
        <SectionHeading
          action={
            <Link
              href={href}
              className="text-fg-muted hover:text-fg font-mono text-xs tracking-wide uppercase transition-colors"
            >
              {seeAllLabel}
            </Link>
          }
        >
          {title}
        </SectionHeading>

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
