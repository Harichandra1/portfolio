import { notFound } from "next/navigation";
import { getEntry, getSlugs } from "@/lib/content/mdx";
import { buildMetadata } from "@/lib/seo";
import { EntryDetail } from "@/components/sections/entry-detail";
import type { SlugPageProps } from "@/types/routes";

export async function generateStaticParams() {
  return (await getSlugs("lab")).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: SlugPageProps) {
  const { slug } = await params;
  const entry = await getEntry("lab", slug);
  if (!entry) return buildMetadata({ title: "Not found", noIndex: true });

  const fm = entry.frontmatter;
  return buildMetadata({
    title: fm.title,
    description: fm.summary,
    path: entry.href,
    image: fm.cover,
    type: "article",
    publishedTime: fm.date,
    tags: fm.tags,
  });
}

export default async function LabPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const entry = await getEntry("lab", slug);
  if (!entry) notFound();

  return <EntryDetail entry={entry} backHref="/lab" backLabel="All experiments" />;
}
