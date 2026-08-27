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
      // next-mdx-remote defaults to stripping every `{}` JS expression from
      // JSX attributes (blockJS: true) — a safeguard for MDX fetched from an
      // untrusted remote source, which would otherwise let arbitrary code
      // execute during render. All content here is authored locally and
      // committed to this repo, never fetched at runtime, so that threat
      // model doesn't apply and the default silently breaks components like
      // <ResultsTable rows={[...]}> and <Stat value={...}> — every prop
      // passed via `{}` came back `undefined`. `blockDangerousJS` (still
      // default-on) keeps blocking real code-execution primitives — eval,
      // Function, require, process, fs — so object/array literals in
      // frontmatter-adjacent MDX are safe to allow through.
      blockJS: false,
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
