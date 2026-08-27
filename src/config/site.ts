/**
 * Every piece of standing site copy lives here. Editing your name, tagline,
 * social links, or navigation should never require touching a component.
 */

export const siteConfig = {
  name: "Hari Chandra",
  /** Shown in the browser tab after the page title, e.g. "Projects · Hari Chandra" */
  shortName: "Hari",
  role: "Backend & AI Engineer",
  tagline: "I build backends for AI products — and the evals that keep them honest.",
  /** The hero H1. Kept separate from `tagline` so metadata copy (used in <title>,
   *  OG cards) can stay a plain sentence while the hero can be a fuller line. */
  positioning: "I build backends for AI products — and the evals that keep them honest.",
  description:
    "Backend engineer in Hyderabad building production LLM systems — agentic RAG, evaluation harnesses, and the REST APIs and data models underneath them.",
  email: "cheetiharichandra2@gmail.com",
  location: "Hyderabad, India",
  locale: "en_US",

  /** Path to the résumé PDF, shown as a download link on /about. */
  resumePath: "/resume.pdf" as string | null,

  links: {
    github: "https://github.com/Harichandra1",
    linkedin: "https://www.linkedin.com/in/harichandraprasad",
  },

  /** Primary navigation. Add a route here and it appears in header + footer. */
  nav: [
    { href: "/projects", label: "Work" },
    { href: "/blog", label: "Writing" },
    { href: "/lab", label: "Lab" },
    { href: "/about", label: "About" },
  ],

  /** Secondary links, footer only. */
  footerNav: [
    { href: "/now", label: "Now" },
    { href: "/rss.xml", label: "RSS" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * Canonical origin, without a trailing slash.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL — set this in Vercel for production.
 *  2. VERCEL_URL — automatically set on preview deployments, so preview builds
 *     produce correct absolute URLs in metadata and OG tags.
 *  3. localhost for local dev.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
  "http://localhost:3000"
).replace(/\/$/, "");

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = "/") {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
