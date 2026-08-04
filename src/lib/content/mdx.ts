import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { cache } from "react";

import { schemas, type ContentType, type Entry } from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

/** URL prefix per content type. `posts` live under /blog. */
const basePaths: Record<ContentType, string> = {
  projects: "/projects",
  posts: "/blog",
  lab: "/lab",
};

export function basePathFor(type: ContentType) {
  return basePaths[type];
}

/**
 * Read and validate every file of a content type.
 *
 * Wrapped in React's `cache` so a single render pass parses the directory once
 * no matter how many components ask for it. Sorted newest first.
 *
 * Throws on invalid frontmatter — that's deliberate. A build that fails loudly
 * beats a production page that silently renders `undefined`.
 */
export const getEntries = cache(
  async <T extends ContentType>(type: T): Promise<Entry<T>[]> => {
    const dir = path.join(CONTENT_DIR, type);
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

    const entries = files.map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = matter(raw);

      const parsed = schemas[type].safeParse(data);
      if (!parsed.success) {
        const issues = parsed.error.issues
          .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("\n");
        throw new Error(
          `Invalid frontmatter in content/${type}/${file}\n${issues}\n` +
            `Expected fields are defined in src/lib/content/schema.ts`,
        );
      }

      return {
        slug,
        type,
        href: `${basePaths[type]}/${slug}`,
        frontmatter: parsed.data,
        body: content,
        readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
      } as Entry<T>;
    });

    return entries
      .filter((e) => !e.frontmatter.draft || process.env.NODE_ENV === "development")
      .sort((a, b) => b.frontmatter.date.getTime() - a.frontmatter.date.getTime());
  },
);

/** A single entry by slug, or `null` if it doesn't exist (route should 404). */
export async function getEntry<T extends ContentType>(type: T, slug: string) {
  const entries = await getEntries(type);
  return entries.find((e) => e.slug === slug) ?? null;
}

/** Every slug of a type — for `generateStaticParams`. */
export async function getSlugs(type: ContentType) {
  return (await getEntries(type)).map((e) => e.slug);
}

/** Unique tags across a type, ordered by frequency then alphabetically. */
export async function getTags(type: ContentType) {
  const counts = new Map<string, number>();
  for (const entry of await getEntries(type)) {
    for (const tag of entry.frontmatter.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));
}

/** Everything across all types, newest first — powers the RSS feed and sitemap. */
export async function getAllEntries() {
  const [projects, posts, lab] = await Promise.all([
    getEntries("projects"),
    getEntries("posts"),
    getEntries("lab"),
  ]);
  return [...projects, ...posts, ...lab].sort(
    (a, b) => b.frontmatter.date.getTime() - a.frontmatter.date.getTime(),
  );
}
