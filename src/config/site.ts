/**
 * Every piece of standing site copy lives here. Editing your name, tagline,
 * social links, or navigation should never require touching a component.
 */

export const siteConfig = {
  name: "Hari Chandra",
  /** Shown in the browser tab after the page title, e.g. "Projects · Hari Chandra" */
  shortName: "Hari",
  role: "Software Engineer",
  tagline: "I build things for the web — and occasionally in three dimensions.",
  description:
    "Portfolio, writing, and experiments by Hari Chandra — software engineer working across web, graphics, and interaction.",
  email: "cheetiharichandra2@gmail.com",
  location: "India",
  locale: "en_US",

  /**
   * Drop a PDF at public/resume.pdf and set this to "/resume.pdf" to show the
   * download button on /about. Left null so the button is hidden rather than
   * linking to a 404.
   */
  resumePath: null as string | null,

  links: {
    github: "https://github.com/",
    linkedin: "https://www.linkedin.com/",
    x: "https://x.com/",
  },

  /** Primary navigation. Add a route here and it appears in header + footer. */
  nav: [
    { href: "/projects", label: "Projects" },
    { href: "/blog", label: "Blog" },
    { href: "/lab", label: "Lab" },
    { href: "/about", label: "About" },
  ],

  /** Secondary links, footer only. */
  footerNav: [
    { href: "/uses", label: "Uses" },
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
