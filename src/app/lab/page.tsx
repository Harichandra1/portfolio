import { getEntries, getTags } from "@/lib/content/mdx";
import { buildMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/sections/page-header";
import { EntryList } from "@/components/sections/entry-list";
import type { SearchParams } from "@/types/routes";
import { Sticker } from "@/components/stickers/sticker";
import { Note } from "@/components/stickers/note";

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
    <div className="relative">
      <Sticker
        name="duck"
        className="top-8 right-[7%] hidden w-20 -rotate-[8deg] lg:block"
      />
      <Sticker
        name="n=4"
        className="top-44 right-[4%] hidden w-16 rotate-[10deg] xl:block"
      />

      <PageHeader
        title="Lab"
        lead="Experiments and sketches. Unfinished on purpose — this is where things go before they're worth a project page."
      >
        <Note className="mt-5" arrow="left">
          nothing here is load-bearing
        </Note>
      </PageHeader>
      <EntryList
        entries={entries}
        tags={tags}
        activeTag={activeTag}
        basePath="/lab"
        emptyMessage="No experiments match that tag yet."
      />
    </div>
  );
}
