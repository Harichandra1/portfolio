import { getEntries, getTags } from "@/lib/content/mdx";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/sections/page-header";
import { EntryList } from "@/components/sections/entry-list";
import type { SearchParams } from "@/types/routes";

export const metadata = buildMetadata({
  title: "Work",
  description: "Backend systems, agents, and the evaluation harnesses behind them.",
  path: "/projects",
});

export default async function ProjectsPage({ searchParams }: SearchParams) {
  const [entries, tags, params] = await Promise.all([
    getEntries("projects"),
    getTags("projects"),
    searchParams,
  ]);

  const activeTag = typeof params.tag === "string" ? params.tag : undefined;

  return (
    <>
      <PageHeader
        title="Work"
        lead="Backend systems, agents, and the evaluation harnesses behind them."
      />
      <EntryList
        entries={entries}
        tags={tags}
        activeTag={activeTag}
        basePath="/projects"
        emptyMessage="No projects match that tag yet."
      />
    </>
  );
}
