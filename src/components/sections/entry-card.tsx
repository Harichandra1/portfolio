import { ArrowUpRight } from "lucide-react";
import { LinkCard, CardTitle } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { formatDate, isoDate } from "@/lib/utils";
import type { AnyEntry } from "@/lib/content/schema";

/**
 * One card in any listing. Deliberately shared across projects, posts, and lab
 * notes — a new content type gets a working list page for free.
 */
export function EntryCard({ entry }: { entry: AnyEntry }) {
  const { frontmatter: fm, href, readingMinutes } = entry;

  // Posts have no `links`; projects and lab notes do.
  const links = entry.type === "posts" ? undefined : entry.frontmatter.links;
  const outbound = links?.live
    ? { href: links.live, label: "Live site" }
    : links?.repo
      ? { href: links.repo, label: "Source" }
      : null;

  return (
    <LinkCard>
      <div className="flex items-start justify-between gap-4">
        <CardTitle href={href}>{fm.title}</CardTitle>
        <ArrowUpRight
          className="text-fg-subtle mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </div>

      <p className="text-fg-muted mt-2 text-sm text-pretty">{fm.summary}</p>

      <div className="text-fg-subtle text-2xs mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono tracking-wide uppercase">
        <time dateTime={isoDate(fm.date)}>{formatDate(fm.date)}</time>
        {entry.type === "posts" ? <span>· {readingMinutes} min read</span> : null}
        {entry.type === "lab" ? <span>· {entry.frontmatter.status}</span> : null}
        {entry.type === "projects" && entry.frontmatter.role ? (
          <span>· {entry.frontmatter.role}</span>
        ) : null}
      </div>

      {fm.tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {fm.tags.map((tag) => (
            <li key={tag}>
              <Tag>{tag}</Tag>
            </li>
          ))}
        </ul>
      ) : null}

      {outbound ? (
        <a
          href={outbound.href}
          target="_blank"
          rel="noreferrer"
          // Sits above the stretched card link so it stays independently clickable.
          className="text-fg-muted hover:text-fg text-2xs relative z-10 mt-3 inline-block font-mono tracking-wide uppercase underline underline-offset-4"
        >
          {outbound.label}
        </a>
      ) : null}
    </LinkCard>
  );
}
