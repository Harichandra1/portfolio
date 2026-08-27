import { Container } from "@/components/ui/container";
import { SectionHeading } from "./section";
import { Tag } from "@/components/ui/tag";
import { ClaimText } from "@/components/ui/claim-text";
import type { Role } from "@content/data/experience";

function formatRange(start: string, end: string | null) {
  const fmt = (value: string) =>
    new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(start)} — ${end ? fmt(end) : "Present"}`;
}

/** A mono date rail beside the role content — 2-col on desktop, stacked on mobile. */
function RoleRow({ role }: { role: Role }) {
  return (
    <li className="border-border reveal grid gap-4 border-t py-8 first:border-t-0 sm:grid-cols-[9rem_1fr]">
      <p className="text-fg-subtle font-mono text-xs tracking-wide uppercase">
        {formatRange(role.start, role.end)}
        {role.location ? (
          <>
            <br />
            {role.location}
          </>
        ) : null}
      </p>

      <div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="text-fg text-xl font-semibold">{role.title}</h3>
          <span className="text-fg-subtle">·</span>
          {role.url ? (
            <a
              href={role.url}
              target="_blank"
              rel="noreferrer"
              className="decoration-border-strong hover:decoration-accent text-fg font-medium underline underline-offset-4"
            >
              {role.company}
            </a>
          ) : (
            <span className="text-fg font-medium">{role.company}</span>
          )}
        </div>

        {role.note ? (
          <p className="text-fg-subtle mt-2 text-sm italic">
            <ClaimText text={role.note} />
          </p>
        ) : null}

        <ul className="text-fg-muted mt-4 space-y-2 text-sm">
          {role.highlights.map((h) => (
            <li key={h} className="flex gap-2.5">
              <span className="text-fg-subtle" aria-hidden>
                —
              </span>
              <span>
                <ClaimText text={h} />
              </span>
            </li>
          ))}
        </ul>

        {role.stack?.length ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {role.stack.map((s) => (
              <li key={s}>
                <Tag>{s}</Tag>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

export function ExperienceTimeline({ roles }: { roles: Role[] }) {
  if (roles.length === 0) return null;

  return (
    <section className="py-20">
      <Container width="wide">
        <SectionHeading>Experience</SectionHeading>
        <ul>
          {roles.map((role) => (
            <RoleRow key={`${role.company}-${role.start}`} role={role} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
