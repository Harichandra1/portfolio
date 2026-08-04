import { getAllEntries } from "@/lib/content/mdx";
import { siteConfig, absoluteUrl, siteUrl } from "@/config/site";

/** Escape the five XML predefined entities. */
function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

/**
 * A single feed covering projects, posts, and lab notes — everything is
 * "things I made", and one feed is easier for a reader to follow than three.
 */
export async function GET() {
  const entries = await getAllEntries();
  const updated = entries[0]?.frontmatter.date ?? new Date();

  const items = entries
    .map((entry) => {
      const url = absoluteUrl(entry.href);
      return `    <item>
      <title>${escapeXml(entry.frontmatter.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(entry.frontmatter.summary)}</description>
      <pubDate>${entry.frontmatter.date.toUTCString()}</pubDate>
      <category>${escapeXml(entry.type)}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
