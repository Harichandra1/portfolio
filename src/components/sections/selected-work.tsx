import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "./section";
import { WorkRow } from "./work-row";
import type { Entry } from "@/lib/content/schema";

export function SelectedWork({ entries }: { entries: Entry<"projects">[] }) {
  if (entries.length === 0) return null;

  return (
    <section id="work" className="scroll-mt-24 py-20">
      <Container width="wide">
        <SectionHeading
          action={
            <Link
              href="/projects"
              className="text-fg-muted hover:text-fg font-mono text-xs tracking-wide uppercase transition-colors"
            >
              All work
            </Link>
          }
        >
          Selected work
        </SectionHeading>

        <ul>
          {entries.map((entry, i) => (
            <WorkRow key={entry.slug} entry={entry} index={i} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
