import { getEntries } from "@/lib/content/mdx";
import { buildMetadata } from "@/lib/seo";
import { Hero } from "@/components/sections/hero";
import { EntryShowcase } from "@/components/sections/entry-showcase";

export const metadata = buildMetadata({ path: "/" });

export default async function HomePage() {
  const [projects, posts, lab] = await Promise.all([
    getEntries("projects"),
    getEntries("posts"),
    getEntries("lab"),
  ]);

  // Featured projects win; otherwise fall back to the most recent, so the home
  // page is never empty just because nothing has been flagged.
  const featured = projects.filter((p) => p.frontmatter.featured);
  const shownProjects = (featured.length > 0 ? featured : projects).slice(0, 4);

  return (
    <>
      <Hero />
      <EntryShowcase
        title="Selected work"
        entries={shownProjects}
        href="/projects"
        seeAllLabel="All projects"
      />
      <EntryShowcase
        title="Writing"
        entries={posts.slice(0, 2)}
        href="/blog"
        seeAllLabel="All posts"
      />
      <EntryShowcase
        title="From the lab"
        entries={lab.slice(0, 2)}
        href="/lab"
        seeAllLabel="All experiments"
      />
    </>
  );
}
