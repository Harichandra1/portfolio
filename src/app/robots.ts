import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // Preview deployments must never be indexed — only the canonical production
  // domain gets a permissive robots.txt.
  const isProduction =
    Boolean(process.env.NEXT_PUBLIC_SITE_URL) && process.env.VERCEL_ENV !== "preview";

  return {
    rules: isProduction
      ? { userAgent: "*", allow: "/" }
      : { userAgent: "*", disallow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
