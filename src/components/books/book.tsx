import type { Book } from "@content/data/books";

/**
 * A book as a CSS 3D object.
 *
 * Four layers stacked on the Z axis inside a `preserve-3d` container: three
 * page-edge slabs and the cover on top. On hover each layer rotates further
 * than the one beneath it (-6°, -12°, -18°, -26°), all hinged on
 * `origin-left`, so the book swings open on its spine and the pages fan out
 * behind it. Staggered delays make it read as paper rather than one rigid
 * object.
 *
 * Depth comes from the rotation and the layered edges — no drop shadows, per
 * the no-shadows rule in CONVENTIONS.md. A real 3D transform doesn't need a
 * fake one underneath it.
 *
 * The transforms are written out longhand rather than generated in a loop:
 * Tailwind scans source for complete class strings, so an arbitrary value
 * built from a variable at runtime produces no CSS at all.
 *
 * `motion-reduce:` pins every layer flat, so this is inert — not merely
 * instant — for anyone who asked for less motion.
 */

const SLAB =
  "absolute inset-y-1.5 origin-left border-y border-r border-paper-line rounded-r-(--radius-sm) " +
  "transition-transform duration-500 ease-out-quint";

function TypographicCover({ book }: { book: Book }) {
  return (
    <span className="bg-bg-subtle relative flex size-full flex-col justify-between p-4">
      {/* A spine strip, so a coverless book still reads as a book. */}
      <span className="bg-border-strong absolute inset-y-0 left-0 w-[6px]" aria-hidden />
      <span className="text-fg-subtle text-2xs pl-3 font-mono tracking-wide uppercase">
        {book.year ?? ""}
      </span>
      <span className="font-display text-fg pl-3 text-xl leading-tight text-balance">
        {book.title}
      </span>
      <span className="text-fg-muted text-2xs pl-3 font-mono tracking-wide uppercase">
        {book.author}
      </span>
    </span>
  );
}

export function Book3D({ book }: { book: Book }) {
  const href =
    book.href ??
    `https://www.google.com/search?q=${encodeURIComponent(`${book.title} ${book.author} book`)}`;

  return (
    <li className="flex flex-col">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={`${book.title} by ${book.author} — search for this book`}
        className="group focus-visible:outline-ring block w-full rounded-(--radius-sm) focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <span className="relative block aspect-[3/4] w-full [perspective:1200px]">
          <span className="ease-out-quint relative block size-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(-10deg)] motion-reduce:group-hover:[transform:none]">
            {/* Back slab */}
            <span
              aria-hidden
              className={`${SLAB} bg-paper-deep right-1 w-[90%] [transform:translateZ(2px)] group-hover:[transform:rotateY(-6deg)_translateZ(2px)_translateX(4px)] motion-reduce:group-hover:[transform:translateZ(2px)]`}
            />

            {/* Middle slab */}
            <span
              aria-hidden
              className={`${SLAB} bg-paper-shade right-1.5 w-[89%] [transform:translateZ(4px)] group-hover:[transform:rotateY(-12deg)_translateZ(4px)_translateX(8px)] group-hover:delay-75 motion-reduce:group-hover:[transform:translateZ(4px)]`}
            />

            {/* Front slab — edge striations and ghosted text */}
            <span
              aria-hidden
              className={`${SLAB} bg-paper right-2 w-[88%] [transform:translateZ(6px)] overflow-hidden group-hover:[transform:rotateY(-18deg)_translateZ(6px)_translateX(12px)] group-hover:delay-100 motion-reduce:group-hover:[transform:translateZ(6px)]`}
            >
              <span className="bg-paper-line absolute inset-y-0 right-1 w-px" />
              <span className="bg-paper-line absolute inset-y-0 right-2 w-px" />
              <span className="absolute inset-0 flex flex-col justify-center gap-1.5 px-5 opacity-40">
                <span className="bg-paper-line h-px w-full" />
                <span className="bg-paper-line h-px w-5/6" />
                <span className="bg-paper-line h-px w-4/5" />
                <span className="bg-paper-line h-px w-11/12" />
                <span className="bg-paper-line h-px w-3/4" />
              </span>
            </span>

            {/* The cover */}
            <span className="border-border-strong ease-out-quint absolute inset-0 origin-left [transform:translateZ(8px)] overflow-hidden rounded-(--radius-sm) border transition-transform duration-500 group-hover:[transform:rotateY(-26deg)_translateZ(8px)] motion-reduce:group-hover:[transform:translateZ(8px)]">
              {book.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- fixed local asset, known aspect ratio
                <img
                  src={book.cover}
                  alt=""
                  className="size-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <TypographicCover book={book} />
              )}
            </span>
          </span>
        </span>
      </a>

      <div className="mt-4">
        <h3 className="text-fg text-sm leading-snug font-medium text-balance">
          {book.title}
        </h3>
        <p className="text-fg-subtle text-2xs mt-0.5 font-mono tracking-wide uppercase">
          {book.author}
        </p>
        <p className="text-fg-muted mt-2 text-sm text-pretty">{book.takeaway}</p>
      </div>
    </li>
  );
}
