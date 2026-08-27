import { now } from "@content/data/now";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/sections/page-header";
import { formatDate, isoDate } from "@/lib/utils";
import { Sticker } from "@/components/stickers/sticker";

export const metadata = buildMetadata({
  title: "Now",
  description: "What I'm focused on at the moment.",
  path: "/now",
});

export default function NowPage() {
  return (
    <div className="relative">
      <Sticker
        name="terminal"
        className="top-6 right-[7%] hidden w-20 rotate-[7deg] lg:block"
      />

      <PageHeader width="prose" title="Now" lead={now.intro}>
        <p className="text-fg-subtle mt-4 font-mono text-xs">
          Last updated{" "}
          <time dateTime={isoDate(now.updated)}>{formatDate(now.updated)}</time>
        </p>
      </PageHeader>

      <Container width="prose" className="pb-16">
        <div className="space-y-10">
          {now.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-fg-subtle mb-3 text-sm font-semibold tracking-wide uppercase">
                {section.title}
              </h2>
              <ul className="text-fg-muted space-y-2 text-[0.975rem]/7">
                {section.items.map((item) => (
                  <li
                    key={item}
                    className="before:text-fg-subtle before:mr-2 before:content-['—']"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="text-fg-subtle mt-14 text-sm">
          This is a{" "}
          <a
            href="https://nownownow.com/about"
            target="_blank"
            rel="noreferrer"
            className="decoration-border-strong hover:decoration-accent underline underline-offset-4"
          >
            now page
          </a>
          .
        </p>
      </Container>
    </div>
  );
}
