import { uses } from "@content/data/uses";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/sections/page-header";

export const metadata = buildMetadata({
  title: "Uses",
  description: "The hardware, software, and tooling I actually reach for.",
  path: "/uses",
});

export default function UsesPage() {
  return (
    <>
      <PageHeader
        width="prose"
        title="Uses"
        lead="The hardware, software, and tooling I actually reach for. Updated whenever something changes."
      />

      <Container width="prose" className="pb-16">
        <div className="space-y-12">
          {uses.map((group) => (
            <section key={group.title}>
              <h2 className="text-fg-subtle mb-4 text-sm font-semibold tracking-wide uppercase">
                {group.title}
              </h2>
              <ul className="divide-border divide-y">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                  >
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-fg decoration-border-strong hover:decoration-accent font-medium underline underline-offset-4"
                      >
                        {item.name}
                      </a>
                    ) : (
                      <span className="text-fg font-medium">{item.name}</span>
                    )}
                    {item.note ? (
                      <span className="text-fg-muted text-sm">{item.note}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
