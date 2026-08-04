import { Container } from "@/components/ui/container";
import { TagLink } from "@/components/ui/tag";
import { EntryCard } from "./entry-card";
import { cn } from "@/lib/utils";
import type { AnyEntry } from "@/lib/content/schema";

/**
 * The body of every listing page: an optional tag filter bar plus a grid of
 * cards. Filtering is driven by the `?tag=` search param so it costs no
 * client-side JavaScript.
 */
export function EntryList({
  entries,
  tags,
  activeTag,
  basePath,
  emptyMessage = "Nothing here yet.",
  columns = 2,
}: {
  entries: AnyEntry[];
  tags: { tag: string; count: number }[];
  activeTag?: string;
  basePath: string;
  emptyMessage?: string;
  columns?: 1 | 2;
}) {
  const filtered = activeTag
    ? entries.filter((e) => e.frontmatter.tags.includes(activeTag))
    : entries;

  return (
    <Container width="wide" className="pb-16">
      {tags.length > 0 ? (
        <nav
          aria-label="Filter by tag"
          className="mb-8 flex flex-wrap items-center gap-1.5"
        >
          <TagLink tag={null} basePath={basePath} active={!activeTag} />
          {tags.map(({ tag, count }) => (
            <TagLink
              key={tag}
              tag={tag}
              count={count}
              basePath={basePath}
              active={activeTag === tag}
            />
          ))}
        </nav>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-fg-muted text-sm">{emptyMessage}</p>
      ) : (
        <ul className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2")}>
          {filtered.map((entry) => (
            <li key={`${entry.type}/${entry.slug}`}>
              <EntryCard entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
