import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Prose } from "@/components/ui/prose";
import { Tag } from "@/components/ui/tag";
import { MdxContent } from "@/components/mdx/mdx-content";
import { SceneView } from "@/three/canvas/scene-view";
import { isSceneName } from "@/three/scenes/names";
import { formatDate, isoDate } from "@/lib/utils";
import type { AnyEntry } from "@/lib/content/schema";

/**
 * The shared shell for every content detail page. Adding a new content type
 * means writing a route that fetches the entry and hands it to this — the
 * header, scene banner, body, and metadata all come for free.
 */
export async function EntryDetail({
  entry,
  backHref,
  backLabel,
}: {
  entry: AnyEntry;
  backHref: string;
  backLabel: string;
}) {
  const fm = entry.frontmatter;
  const links = entry.type === "posts" ? undefined : entry.frontmatter.links;

  const outbound = [
    links?.live && { href: links.live, label: "Live site" },
    links?.repo && { href: links.repo, label: "Source" },
    entry.type === "projects" &&
      entry.frontmatter.links.writeup && {
        href: entry.frontmatter.links.writeup,
        label: "Write-up",
      },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <article>
      <Container width="prose" className="pt-10">
        <Link
          href={backHref}
          className="text-fg-muted hover:text-fg inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {backLabel}
        </Link>

        <h1 className="text-fg mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {fm.title}
        </h1>

        <p className="text-fg-muted mt-3 text-pretty">{fm.summary}</p>

        <div className="text-fg-subtle mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          <time dateTime={isoDate(fm.date)}>{formatDate(fm.date)}</time>
          {fm.updated ? <span>· updated {formatDate(fm.updated)}</span> : null}
          {entry.type === "posts" ? <span>· {entry.readingMinutes} min read</span> : null}
          {entry.type === "lab" ? <span>· {entry.frontmatter.status}</span> : null}
        </div>

        {fm.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {fm.tags.map((tag) => (
              <li key={tag}>
                <Tag>{tag}</Tag>
              </li>
            ))}
          </ul>
        ) : null}

        {outbound.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-4">
            {outbound.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-fg decoration-border-strong hover:decoration-accent text-sm font-medium underline underline-offset-4"
              >
                {label}
              </a>
            ))}
          </div>
        ) : null}
      </Container>

      {/* A `scene:` in frontmatter turns into a banner, with the usual poster
          fallback when 3D isn't available. */}
      {fm.scene && isSceneName(fm.scene) ? (
        <Container width="wide" className="mt-10">
          <div className="border-border bg-bg-subtle aspect-[16/7] overflow-hidden rounded-xl border">
            <SceneView name={fm.scene} />
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
