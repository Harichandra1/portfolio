import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Prose } from "@/components/ui/prose";
import { Tag } from "@/components/ui/tag";
import { MdxContent } from "@/components/mdx/mdx-content";
import { figureRegistry, isFigureName } from "@/components/figures";
import { formatDate, isoDate } from "@/lib/utils";
import type { Entry } from "@/lib/content/schema";

/**
 * The deep layout for a project with `kind: "case-study"` — a facts rail
 * instead of a plain metadata line, and room for a header figure. Everything
 * else (posts, lab notes, lighter `kind: "project"` entries) uses the
 * lighter `EntryDetail` shell; reserve this for work with enough real
 * material to earn it — see CONVENTIONS.md.
 */
export async function CaseStudy({
  entry,
  backHref,
}: {
  entry: Entry<"projects">;
  backHref: string;
}) {
  const fm = entry.frontmatter;
  const Figure = fm.figure && isFigureName(fm.figure) ? figureRegistry[fm.figure] : null;

  const links = [
    fm.links.live && { href: fm.links.live, label: "Live" },
    fm.links.repo && { href: fm.links.repo, label: "Source" },
    fm.links.writeup && { href: fm.links.writeup, label: "Write-up" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <article>
      <Container width="prose" className="pt-10">
        <Link
          href={backHref}
          className="text-fg-muted hover:text-fg inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          All work
        </Link>

        <p className="text-accent mt-8 font-mono text-xs tracking-wide uppercase">
          Case study
        </p>
        <h1 className="font-display text-fg mt-3 text-4xl text-balance sm:text-5xl">
          {fm.title}
        </h1>
        <p className="text-fg-muted mt-4 text-lg text-pretty">{fm.summary}</p>

        {/* Facts rail — role/timeline/stack/links at a glance before the
            nine-section body. */}
        <dl className="border-border mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-y py-6 sm:grid-cols-4">
          {fm.role ? (
            <div>
              <dt className="text-fg-subtle text-2xs font-mono tracking-wide uppercase">
                Role
              </dt>
              <dd className="text-fg mt-1 text-sm">{fm.role}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-fg-subtle text-2xs font-mono tracking-wide uppercase">
              Timeline
            </dt>
            <dd className="text-fg mt-1 text-sm">
              <time dateTime={isoDate(fm.date)}>{formatDate(fm.date)}</time>
            </dd>
          </div>
          {fm.stack.length > 0 ? (
            <div className="col-span-2">
              <dt className="text-fg-subtle text-2xs font-mono tracking-wide uppercase">
                Stack
              </dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {fm.stack.map((s) => (
                  <Tag key={s}>{s}</Tag>
                ))}
              </dd>
            </div>
          ) : null}
          {links.length > 0 ? (
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-fg-subtle text-2xs font-mono tracking-wide uppercase">
                Links
              </dt>
              <dd className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="decoration-border-strong hover:decoration-accent text-fg text-sm font-medium underline underline-offset-4"
                  >
                    {l.label}
                  </a>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </Container>

      {Figure ? (
        <Container width="prose" className="mt-10">
          <div className="border-border bg-bg-subtle rounded-(--radius-lg) border p-6">
            <Figure variant="full" />
          </div>
        </Container>
      ) : null}

      <Container width="prose" className="mt-10">
        <Prose>
          <MdxContent source={entry.body} />
        </Prose>
      </Container>
    </article>
  );
}
