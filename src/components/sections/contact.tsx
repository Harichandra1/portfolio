import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function Contact() {
  return (
    <section id="contact" className="border-border scroll-mt-24 border-t py-24">
      <Container width="prose">
        <h2 className="font-display text-fg max-w-md text-3xl text-balance sm:text-4xl">
          Want to talk about a backend, an agent, or an eval that keeps you honest?
        </h2>
        <p className="text-fg-muted mt-4">Email is fastest — I read everything.</p>

        <a
          href={`mailto:${siteConfig.email}`}
          className="decoration-border-strong hover:decoration-accent text-fg mt-6 inline-block font-mono text-xl break-all underline underline-offset-4"
        >
          {siteConfig.email}
        </a>

        <div className="text-fg-muted mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs tracking-wide uppercase">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className="hover:text-fg transition-colors"
          >
            GitHub
          </a>
          <a
            href={siteConfig.links.linkedin}
            target="_blank"
            rel="noreferrer"
            className="hover:text-fg transition-colors"
          >
            LinkedIn
          </a>
          {siteConfig.resumePath ? (
            <a
              href={siteConfig.resumePath}
              target="_blank"
              rel="noreferrer"
              className="hover:text-fg transition-colors"
            >
              Résumé — PDF
            </a>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
