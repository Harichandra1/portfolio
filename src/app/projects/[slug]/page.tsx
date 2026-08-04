import { notFound } from "next/navigation";
import { getEntry, getSlugs } from "@/lib/content/mdx";
import { buildMetadata } from "@/lib/seo";
import { EntryDetail } from "@/components/sections/entry-detail";
import type { SlugPageProps } from "@/types/routes";

/** Pre-render every project at build time. */
export async function generateStaticParams() {
  return (await getSlugs("projects")).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: SlugPageProps) {
  const { slug } = await params;
  const entry = await getEntry("projects", slug);
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

export default async function ProjectPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const entry = await getEntry("projects", slug);
  if (!entry) notFound();

  return <EntryDetail entry={entry} backHref="/projects" backLabel="All projects" />;
}
