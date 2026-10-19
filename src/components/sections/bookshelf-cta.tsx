import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { shelves, bookCount } from "@content/data/books";

/**
 * The one invitation on the home page to somewhere that isn't work.
 *
 * /books was previously reachable only from a footer link, which is where
 * links go to be ignored. It's also the page that says the most about how I
 * think, so it earns an actual destination on the home page — and it owns the
 * accent in its own viewport (the hero's primary CTA is far above, and the
 * sections between here and there are deliberately accent-free). Check that
 * before adding another accent use anywhere near it; see CONVENTIONS.md.
 *
 * The spines are real: titles come from the shelf data, not from a decorative
 * placeholder, so this can never advertise books that aren't there.
 *
 * Each spine is two nested spans with one job each — the outer carries its
 * resting angle, the inner carries only the hover delta. That split is what
 * lets `motion-reduce` cancel the hover motion without also flattening the
 * resting fan, which pinning a single element's transform would do.
 *
 * The hover transforms are written out longhand, like the book in
 * books/book.tsx: Tailwind scans source for complete class strings, so an
 * arbitrary value assembled from a variable at runtime emits no CSS at all.
 */

const SPINE_REST = [-5, -3, -1, 1, 3, 5];

const SPINE_HOVER = [
  "group-hover:[transform:translateX(-14px)_translateY(-8px)_rotate(-8deg)]",
  "group-hover:[transform:translateX(-8px)_translateY(-4px)_rotate(-5deg)]",
  "group-hover:[transform:translateX(-3px)_translateY(-2px)_rotate(-2deg)]",
  "group-hover:[transform:translateX(3px)_translateY(-2px)_rotate(2deg)]",
  "group-hover:[transform:translateX(8px)_translateY(-4px)_rotate(5deg)]",
  "group-hover:[transform:translateX(14px)_translateY(-8px)_rotate(8deg)]",
];

export function BookshelfCta() {
  const total = bookCount();
  if (total === 0) return null;

  const spines = shelves.flatMap((shelf) => shelf.books).slice(0, SPINE_HOVER.length);

  return (
    <section className="border-border border-t py-20">
      <Container width="wide">
        <Link
          href="/books"
          className="group focus-visible:outline-ring block rounded-(--radius-lg) focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <div className="border-border group-hover:border-border-strong group-hover:bg-bg-subtle duration-base grid gap-10 rounded-(--radius-lg) border p-8 transition-colors sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-fg-subtle font-mono text-xs tracking-wide uppercase">
                Beyond the work
              </p>

              <h2 className="font-display text-fg mt-4 text-3xl text-balance sm:text-4xl">
                The bookshelf
              </h2>

              <p className="text-fg-muted mt-4 max-w-md text-pretty">
                {total} books I can say something specific about. Every one carries the
                sentence that earned it a place — if I can&rsquo;t write what a book
                changed, it isn&rsquo;t on the shelf.
              </p>

              <span className="bg-accent text-accent-fg duration-base mt-7 inline-flex h-11 items-center gap-2 rounded-(--radius-md) px-5 text-sm font-medium transition-opacity group-hover:opacity-90">
                Open the bookshelf
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </div>

            {/* Decoration: the titles are already in the copy's reach and the
                destination is the real page, so this says nothing a screen
                reader needs to hear twice. */}
            <div
              aria-hidden
              className="hidden shrink-0 items-end justify-center gap-1.5 sm:flex"
            >
              {spines.map((book, i) => (
                <span
                  key={`${book.title}-${book.author}`}
                  className="block"
                  style={{ transform: `rotate(${SPINE_REST[i]}deg)` }}
                >
                  <span
                    className={`border-border-strong bg-bg-elevated ease-out-quint relative block h-44 w-9 overflow-hidden rounded-(--radius-sm) border transition-transform duration-500 motion-reduce:group-hover:[transform:none] ${SPINE_HOVER[i]}`}
                  >
                    {/* The head band, where a spine's title block sits on a
                        real book. */}
                    <span className="bg-border-strong absolute inset-x-0 top-5 h-px" />
                    {/* Surname, not title: a 36px spine fits "KLEPPMANN" and
                        truncates "Designing Data-Intensive Applications" mid-
                        word, which looks like a bug rather than a book. The
                        titles are one click away on the page this links to.

                        Absolutely positioned rather than flowed, because a
                        float beside a vertical-writing-mode block pushes the
                        text out of the box entirely — which is exactly what
                        the first version of this did. */}
                    <span className="text-fg-muted text-2xs absolute inset-0 px-1.5 pt-8 pb-3 font-mono tracking-wide uppercase [writing-mode:vertical-rl]">
                      {book.author.split(" ").at(-1)}
                    </span>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </Link>
      </Container>
    </section>
  );
}
