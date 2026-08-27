import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { experience, education, certifications } from "@content/data/experience";
import { skillGroups } from "@content/data/skills";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/sections/page-header";
import { SectionHeading } from "@/components/sections/section";
import { ExperienceTimeline } from "@/components/sections/experience-timeline";
import { Skills } from "@/components/sections/skills";
import { Contact } from "@/components/sections/contact";

export const metadata = buildMetadata({
  title: "About",
  description: `About ${siteConfig.name} — background, experience, and how to get in touch.`,
  path: "/about",
});

function formatRange(start: string, end: string | null) {
  const fmt = (value: string) =>
    new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(start)} — ${end ? fmt(end) : "Present"}`;
}

export default function AboutPage() {
  return (
    <>
      <PageHeader width="prose" title="About" />

      <Container width="prose" className="pb-8">
        <div className="text-fg-muted space-y-4 text-lg">
          <p>
            I&rsquo;m a backend engineer in Hyderabad. I like the parts of a system that
            are unglamorous and load-bearing: the data model, the query that got slow, the
            retry that should have been idempotent, and the dashboard that tells you which
            of those three is on fire.
          </p>
          <p>
            Right now I&rsquo;m a founding engineer at Metry AI, working asynchronously
            with a team about ten hours away on SOJO — a client-management platform for
            beauty and wellness businesses across Asia. I joined as a backend engineer and
            moved onto the founding engineering team about three months in. Outside work I
            build agent systems, mostly to find out where they break: my macOS
            troubleshooting agent exists as much for its evaluation harness as for its
            answers.
          </p>
        </div>
      </Container>

      <ExperienceTimeline roles={experience} />
      <Skills groups={skillGroups} />

      <section className="py-20">
        <Container width="wide">
          <SectionHeading>Education</SectionHeading>
          <ul className="space-y-6">
            {education.map((e) => (
              <li key={e.school}>
                <h3 className="text-fg text-xl font-semibold">{e.credential}</h3>
                <p className="text-fg-muted mt-1 text-sm">{e.school}</p>
                <p className="text-fg-subtle text-2xs mt-1 font-mono tracking-wide uppercase">
                  {formatRange(e.start, e.end)}
                  {e.note ? ` · ${e.note}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-20">
        <Container width="wide">
          <SectionHeading>Certifications</SectionHeading>
          <ul className="divide-border divide-y">
            {certifications.map((c) => (
              <li
                key={c.name}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
              >
                {c.url ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="decoration-border-strong hover:decoration-accent text-fg font-medium underline underline-offset-4"
                  >
                    {c.name}
                  </a>
                ) : (
                  <span className="text-fg font-medium">{c.name}</span>
                )}
                <span className="text-fg-subtle text-2xs font-mono tracking-wide uppercase">
                  {c.issuer}
                  {c.status === "in-progress" ? " · In progress" : ""}
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Contact />
    </>
  );
}
