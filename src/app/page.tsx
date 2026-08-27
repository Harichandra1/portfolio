import Link from "next/link";
import { getEntries } from "@/lib/content/mdx";
import { buildMetadata } from "@/lib/seo";
import { experience } from "@content/data/experience";
import { skillGroups } from "@content/data/skills";
import { Container } from "@/components/ui/container";
import { Hero } from "@/components/sections/hero";
import { SelectedWork } from "@/components/sections/selected-work";
import { SectionHeading } from "@/components/sections/section";
import { EntryCard } from "@/components/sections/entry-card";
import { Skills } from "@/components/sections/skills";
import { ExperienceTimeline } from "@/components/sections/experience-timeline";
import { Contact } from "@/components/sections/contact";

export const metadata = buildMetadata({ path: "/" });

export default async function HomePage() {
  const [projects, posts, lab] = await Promise.all([
    getEntries("projects"),
    getEntries("posts"),
    getEntries("lab"),
  ]);

  const recentPosts = posts.slice(0, 2);
  const recentLab = lab.slice(0, 2);

  return (
    <>
      <Hero />

      <SelectedWork entries={projects} />

      <section className="border-border border-t py-20">
        <Container width="prose">
          <p className="text-fg-muted text-lg">
            I&rsquo;m a backend engineer in Hyderabad, currently a founding engineer at
            Metry AI. I like the parts of a system that are unglamorous and load-bearing —
            and I build agent systems on the side mostly to find out where they break.
          </p>
          <Link
            href="/about"
            className="decoration-border-strong hover:decoration-accent text-fg mt-4 inline-block font-mono text-xs tracking-wide uppercase underline underline-offset-4"
          >
            More about me
          </Link>
        </Container>
      </section>

      <Skills groups={skillGroups} />
      <ExperienceTimeline roles={experience} />

      {(recentPosts.length > 0 || recentLab.length > 0) && (
        <section className="py-20">
          <Container width="wide">
            <div className="grid gap-12 sm:grid-cols-2">
              {recentPosts.length > 0 ? (
                <div>
                  <SectionHeading
                    action={
                      <Link
                        href="/blog"
                        className="text-fg-muted hover:text-fg font-mono text-xs tracking-wide uppercase transition-colors"
                      >
                        All posts
                      </Link>
                    }
                  >
                    Writing
                  </SectionHeading>
                  <ul className="space-y-4">
                    {recentPosts.map((entry) => (
                      <li key={entry.slug}>
                        <EntryCard entry={entry} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {recentLab.length > 0 ? (
                <div>
                  <SectionHeading
                    action={
                      <Link
                        href="/lab"
                        className="text-fg-muted hover:text-fg font-mono text-xs tracking-wide uppercase transition-colors"
                      >
                        All experiments
                      </Link>
                    }
                  >
                    Lab
                  </SectionHeading>
                  <ul className="space-y-4">
                    {recentLab.map((entry) => (
                      <li key={entry.slug}>
                        <EntryCard entry={entry} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Container>
        </section>
      )}

      <Contact />
    </>
  );
}
