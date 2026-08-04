import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";

import { mdxComponents } from "./index";

const prettyCodeOptions: PrettyCodeOptions = {
  // Both themes are emitted as CSS variables; globals.css picks one per theme.
  theme: { light: "github-light", dark: "github-dark" },
  keepBackground: false,
  defaultLang: "plaintext",
};

/**
 * Renders an MDX body on the server.
 *
 * This is the only place the remark/rehype chain is configured, so every piece
 * of content — projects, posts, lab notes — is processed identically.
 */
export async function MdxContent({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      // Frontmatter is parsed separately by lib/content/mdx.ts, so it has
      // already been stripped by the time the body reaches here.
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypePrettyCode, prettyCodeOptions],
          [
            rehypeAutolinkHeadings,
            {
              behavior: "wrap",
              properties: { className: ["no-underline"] },
            },
          ],
        ],
      },
    },
  });

  return content;
}
