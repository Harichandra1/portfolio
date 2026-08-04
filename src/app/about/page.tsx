import { Download, Mail } from "lucide-react";
import { experience, education, type Role } from "@content/data/experience";
import { siteConfig } from "@/config/site";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { PageHeader } from "@/components/sections/page-header";

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

function RoleItem({ role }: { role: Role }) {
  return (
    <li className="border-border relative border-l pb-8 pl-6 last:pb-0">
      <span
        className="bg-accent absolute top-1.5 -left-[4.5px] size-2 rounded-full"
        aria-hidden
      />

      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 className="text-fg font-medium">{role.title}</h3>
        <span className="text-fg-subtle">at</span>
        {role.url ? (
          <a
            href={role.url}
            target="_blank"
            rel="noreferrer"
            className="text-fg decoration-border-strong hover:decoration-accent font-medium underline underline-offset-4"
          >
            {role.company}
          </a>
        ) : (
          <span className="text-fg font-medium">{role.company}</span>
        )}
      </div>

      <p className="text-fg-subtle mt-1 font-mono text-xs">
        {formatRange(role.start, role.end)}
        {role.location ? ` · ${role.location}` : ""}
      </p>

      <ul className="text-fg-muted mt-3 space-y-1.5 text-sm">
        {role.highlights.map((h) => (
          <li key={h} className="before:text-fg-subtle before:mr-2 before:content-['—']">
            {h}
          </li>
        ))}
      </ul>

      {role.stack?.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {role.stack.map((s) => (
            <li key={s}>
              <Tag>{s}</Tag>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function AboutPage() {
  return (
    <>
      <PageHeader width="prose" title="About" lead={siteConfig.tagline}>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href={`mailto:${siteConfig.email}`} size="sm">
            <Mail aria-hidden />
            Get in touch
          </ButtonLink>
          {siteConfig.resumePath ? (
            <ButtonLink
              href={siteConfig.resumePath}
              variant="outline"
              size="sm"
              target="_blank"
            >
              <Download aria-hidden />
              Resume
            </ButtonLink>
          ) : null}
        </div>
      </PageHeader>

      <Container width="prose" className="pb-16">
        <section className="text-fg-muted text-[0.975rem]/7">
          <p>
            Replace this with a few sentences in your own voice: what you work on, what
            you care about, and what you&rsquo;re looking for. Two short paragraphs is
            plenty — the timeline below carries the detail.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-fg-subtle mb-6 text-sm font-semibold tracking-wide uppercase">
            Experience
          </h2>
          <ul>
            {experience.map((role) => (
              <RoleItem key={`${role.company}-${role.start}`} role={role} />
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="text-fg-subtle mb-6 text-sm font-semibold tracking-wide uppercase">
            Education
          </h2>
          <ul className="space-y-4">
            {education.map((e) => (
              <li key={e.school}>
                <h3 className="text-fg font-medium">{e.credential}</h3>
                <p className="text-fg-muted mt-1 text-sm">{e.school}</p>
                <p className="text-fg-subtle mt-1 font-mono text-xs">
                  {formatRange(e.start, e.end)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-border bg-bg-subtle mt-14 rounded-lg border p-6">
          <h2 className="text-fg font-medium">Contact</h2>
          <p className="text-fg-muted mt-2 text-sm">
            The fastest way to reach me is email — I read everything.
          </p>
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-fg decoration-border-strong hover:decoration-accent mt-3 inline-block font-mono text-sm underline underline-offset-4"
          >
            {siteConfig.email}
          </a>
        </section>
      </Container>
    </>
  );
}
