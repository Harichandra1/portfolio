import { getEntries, getTags } from "@/lib/content/mdx";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/sections/page-header";
import { EntryList } from "@/components/sections/entry-list";
import type { SearchParams } from "@/types/routes";

export const metadata = buildMetadata({
  title: "Blog",
  description:
    "Notes on building things — architecture, graphics, and the occasional detour.",
  path: "/blog",
});

export default async function BlogPage({ searchParams }: SearchParams) {
  const [entries, tags, params] = await Promise.all([
    getEntries("posts"),
    getTags("posts"),
    searchParams,
  ]);

  const activeTag = typeof params.tag === "string" ? params.tag : undefined;

  return (
    <>
      <PageHeader
        title="Blog"
        lead="Notes on building things — architecture, graphics, and the occasional detour."
      />
      <EntryList
        entries={entries}
        tags={tags}
        activeTag={activeTag}
        basePath="/blog"
        columns={1}
        emptyMessage="No posts match that tag yet."
      />
    </>
  );
}
