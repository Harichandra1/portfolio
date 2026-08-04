import { getEntries, getTags } from "@/lib/content/mdx";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/sections/page-header";
import { EntryList } from "@/components/sections/entry-list";
import type { SearchParams } from "@/types/routes";

export const metadata = buildMetadata({
  title: "Lab",
  description: "Experiments, sketches, and things that don't warrant a project page.",
  path: "/lab",
});

export default async function LabPage({ searchParams }: SearchParams) {
  const [entries, tags, params] = await Promise.all([
    getEntries("lab"),
    getTags("lab"),
    searchParams,
  ]);

  const activeTag = typeof params.tag === "string" ? params.tag : undefined;

  return (
    <>
      <PageHeader
        title="Lab"
        lead="Experiments and sketches. Unfinished on purpose — this is where things go before they're worth a project page."
      />
      <EntryList
        entries={entries}
        tags={tags}
        activeTag={activeTag}
        basePath="/lab"
        emptyMessage="No experiments match that tag yet."
      />
    </>
  );
}
