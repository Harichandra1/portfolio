import Link from "next/link";
import type { MDXComponents } from "mdx/types";

import { Callout } from "./callout";
import { Figure, Video } from "./figure";
import { Scene } from "./scene-embed";

/**
 * What MDX files are allowed to use.
 *
 * Anything added here becomes available in every `.mdx` file with no import —
 * this map is the API surface your content writes against. Keep it small and
 * intentional; content shouldn't reach into arbitrary app components.
 */
export const mdxComponents: MDXComponents = {
  // Internal links get client-side navigation; external ones open safely.
  a: ({ href = "", children, ...props }) => {
    const external = /^https?:\/\//.test(href);
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer noopener" {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  },

  Callout,
  Figure,
  Video,
  Scene,
};
