import type { Metadata } from "next";
import { siteConfig, siteUrl, absoluteUrl } from "@/config/site";

type BuildMetadataArgs = {
  title?: string;
  description?: string;
  /** Site-relative path, e.g. "/blog/hello". Used for the canonical URL. */
  path?: string;
  /** Absolute or site-relative image. Defaults to the generated OG card. */
  image?: string;
  /** Use "article" for blog posts and project pages. */
  type?: "website" | "article";
  publishedTime?: Date | string;
  tags?: readonly string[];
  noIndex?: boolean;
};

/**
 * Single source of page metadata. Every route calls this so canonical URLs,
 * OG tags, and Twitter cards can never drift apart.
 */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image,
  type = "website",
  publishedTime,
  tags,
  noIndex = false,
}: BuildMetadataArgs = {}): Metadata {
  const url = absoluteUrl(path);
  // Falls back to the runtime-generated card in src/app/opengraph-image.tsx.
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : absoluteUrl(image)
    : absoluteUrl("/opengraph-image");

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type,
      url,
      title: title ? `${title} · ${siteConfig.name}` : siteConfig.name,
      description,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title ?? siteConfig.name }],
      ...(type === "article" && publishedTime
        ? {
            publishedTime: new Date(publishedTime).toISOString(),
            authors: [siteConfig.name],
            tags: tags ? [...tags] : undefined,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: title ? `${title} · ${siteConfig.name}` : siteConfig.name,
      description,
      images: [ogImage],
    },
  };
}
