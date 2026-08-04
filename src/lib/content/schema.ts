import { z } from "zod";

/**
 * The contract for MDX frontmatter.
 *
 * These schemas are enforced at build time — a typo in a frontmatter key fails
 * `next build` with a readable error rather than rendering a broken page in
 * production. Adding a field here is how you extend content; every list page,
 * feed, and detail route reads from the resulting type.
 */

const link = z.url();

/** Fields shared by every content type. */
const base = z.object({
  title: z.string().min(1),
  summary: z.string().min(1).max(240),
  /** ISO date, e.g. 2026-08-04. Drives ordering everywhere. */
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  /** Path under /public, e.g. "/images/foo.jpg". Used for cards and OG. */
  cover: z.string().optional(),
  /** Drafts render in `next dev` but are excluded from production builds. */
  draft: z.boolean().default(false),
  /** Name of a scene in src/three/scenes/registry.ts. */
  scene: z.string().optional(),
});

export const projectSchema = base.extend({
  /** Pinned to the home page. */
  featured: z.boolean().default(false),
  /** Short role/status line shown on cards, e.g. "Solo · Shipped 2026". */
  role: z.string().optional(),
  links: z
    .object({
      repo: link.optional(),
      live: link.optional(),
      writeup: link.optional(),
    })
    .default({}),
});

export const postSchema = base.extend({
  featured: z.boolean().default(false),
});

export const labSchema = base.extend({
  /** Experiments are explicitly allowed to be unfinished. */
  status: z.enum(["sketch", "working", "abandoned"]).default("sketch"),
  links: z
    .object({
      repo: link.optional(),
      live: link.optional(),
    })
    .default({}),
});

export const schemas = {
  projects: projectSchema,
  posts: postSchema,
  lab: labSchema,
} as const;

export type ContentType = keyof typeof schemas;

export type ProjectFrontmatter = z.output<typeof projectSchema>;
export type PostFrontmatter = z.output<typeof postSchema>;
export type LabFrontmatter = z.output<typeof labSchema>;

export type FrontmatterFor<T extends ContentType> = z.output<(typeof schemas)[T]>;

/** A parsed content file: validated frontmatter plus derived metadata. */
export type Entry<T extends ContentType> = {
  slug: string;
  type: T;
  /** Site-relative URL, e.g. "/blog/hello-world". */
  href: string;
  frontmatter: FrontmatterFor<T>;
  /** Raw MDX body, without frontmatter. */
  body: string;
  readingMinutes: number;
};

/**
 * An entry of any type, as a discriminated union on `type`. Components that
 * render mixed listings (search, RSS, the home page) take this.
 */
export type AnyEntry = Entry<"projects"> | Entry<"posts"> | Entry<"lab">;
