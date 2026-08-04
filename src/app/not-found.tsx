import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container width="prose" className="flex min-h-[60vh] flex-col justify-center py-20">
      <p className="text-accent font-mono text-sm">404</p>
      <h1 className="text-fg mt-3 text-3xl font-semibold tracking-tight">
        This page doesn&rsquo;t exist.
      </h1>
      <p className="text-fg-muted mt-3">It may have moved, or the link may be wrong.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/" size="sm">
          Back home
        </ButtonLink>
        <ButtonLink href="/projects" variant="outline" size="sm">
          Browse projects
        </ButtonLink>
      </div>
    </Container>
  );
}
