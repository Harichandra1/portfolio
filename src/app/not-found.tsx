import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Sticker } from "@/components/stickers/sticker";
import { Note } from "@/components/stickers/note";

export default function NotFound() {
  return (
    <Container
      width="prose"
      className="relative flex min-h-[60vh] flex-col justify-center py-20"
    >
      <Sticker
        name="duck"
        className="top-10 right-2 hidden w-24 rotate-[12deg] sm:block"
      />
      <p className="text-accent font-mono text-sm">404</p>
      <h1 className="text-fg mt-3 text-3xl font-semibold tracking-tight">
        This page doesn&rsquo;t exist.
      </h1>
      <p className="text-fg-muted mt-3">It may have moved, or the link may be wrong.</p>
      <Note className="mt-4">the duck doesn&rsquo;t know either</Note>
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
