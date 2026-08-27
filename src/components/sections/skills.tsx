import { Container } from "@/components/ui/container";
import { SectionHeading } from "./section";
import type { SkillGroup } from "@content/data/skills";

/**
 * Grouped skills, mono labels, no proficiency bars. A 1–5 "expert" slider is
 * unfalsifiable and cheapens the page — see CONVENTIONS.md.
 */
export function Skills({ groups }: { groups: SkillGroup[] }) {
  return (
    <section className="py-20">
      <Container width="wide">
        <SectionHeading>What I work with</SectionHeading>

        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-fg text-2xs font-mono tracking-wide uppercase">
                {group.title}
              </h3>
              <ul className="mt-3 space-y-1.5">
                {group.items.map((item) => (
                  <li key={item} className="text-fg-muted text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
