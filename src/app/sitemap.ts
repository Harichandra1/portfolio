import type { MetadataRoute } from "next";
import { getAllEntries } from "@/lib/content/mdx";
import { absoluteUrl } from "@/config/site";

/** Static routes. Add a page and it belongs here. */
const staticPaths = ["/", "/projects", "/blog", "/lab", "/about", "/books", "/now"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getAllEntries();

  return [
    ...staticPaths.map((path) => ({
      url: absoluteUrl(path),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    // Content routes come straight from the filesystem, so a new MDX file is
    // in the sitemap the moment it's committed.
    ...entries.map((entry) => ({
      url: absoluteUrl(entry.href),
      lastModified: entry.frontmatter.updated ?? entry.frontmatter.date,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
