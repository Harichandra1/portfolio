/**
 * The shelf.
 *
 * One rule, enforced by the type system: **`takeaway` is required.** If you
 * can't write a sentence about what a book changed in how you work or think,
 * it doesn't go on the shelf — regardless of genre. A wall of covers with
 * nothing said about them is a list of purchases; a short shelf with a real
 * line under each is a sample of how you think, which is the only version
 * worth putting on a hiring-facing site.
 *
 * That rule is genre-blind on purpose. Meditations earns its place under it
 * and a generic productivity title doesn't.
 *
 * Covers: drop a file in public/covers/ and set `cover: "/covers/name.webp"`.
 * Anything without one renders a typographic cover in the site's own serif
 * and mono instead, so a missing image never leaves a hole in the grid.
 */

export type Book = {
  title: string;
  author: string;
  /** What it changed. Required — see above. One sentence, specific. */
  takeaway: string;
  /** Path under /public, e.g. "/covers/meditations.webp". */
  cover?: string;
  /** Year you finished it, if you remember. */
  year?: number;
  /** Overrides the default web search on click. */
  href?: string;
};

export type Shelf = {
  title: string;
  /** One line on why these are grouped together. */
  note?: string;
  books: Book[];
};

export const shelves: Shelf[] = [
  {
    title: "Shaped how I build",
    books: [
      {
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        cover: "/covers/ddia.webp",
        takeaway:
          "Replication, partitioning, and consistency stopped being settings I inherited and became trade-offs I have to pick. Most of the indexing and query work I do now traces back to it.",
      },
      {
        title: "AI Engineering",
        author: "Chip Huyen",
        cover: "/covers/ai-engineering.webp",
        takeaway:
          "Pushed me toward evaluation being the actual work rather than the afterthought — which is why my macOS agent has a judge panel and a regression gate at all.",
      },
      {
        title: "Java: A Beginner's Guide",
        author: "Herbert Schildt",
        cover: "/covers/java-beginners-guide.webp",
        takeaway:
          "Where types and objects finally clicked. The habits I picked up here are still underneath the Spring Boot code I write.",
      },
      {
        title: "Automate the Boring Stuff with Python",
        author: "Al Sweigart",
        cover: "/covers/automate-boring-stuff.webp",
        takeaway:
          "Where I started. It framed programming as something you point at an annoying task, which is still how I decide what's worth building.",
      },
    ],
  },
];

/** Total across every shelf — for the page's own count. */
export function bookCount() {
  return shelves.reduce((n, s) => n + s.books.length, 0);
}
