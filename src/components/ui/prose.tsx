import { cn } from "@/lib/utils";

/**
 * Typographic wrapper for rendered MDX. Deliberately hand-rolled rather than
 * using @tailwindcss/typography so that long-form styling reads from the same
 * semantic tokens as the rest of the site.
 */
export function Prose({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "text-fg-muted max-w-none text-[0.975rem]/7",
        // headings
        "[&_h2]:text-fg [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight",
        "[&_h3]:text-fg [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:scroll-mt-24 [&_h3]:text-base [&_h3]:font-semibold",
        "[&_h4]:text-fg [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:scroll-mt-24 [&_h4]:font-semibold",
        // flow
        "[&_li]:my-1 [&_ol]:my-4 [&_p]:my-4 [&_ul]:my-4",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_hr]:border-border [&_hr]:my-10",
        // inline
        "[&_strong]:text-fg [&_strong]:font-semibold",
        "[&_a]:text-fg [&_a]:decoration-border-strong [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4",
        "hover:[&_a]:decoration-accent",
        "[&_:not(pre)>code]:bg-bg-subtle [&_:not(pre)>code]:text-fg [&_:not(pre)>code]:rounded [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.85em]",
        // blocks
        "[&_blockquote]:border-accent [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_figure]:my-6 [&_img]:rounded-lg",
        // tables scroll rather than blowing out the page on mobile
        "[&_table]:my-6 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:text-sm",
        "[&_th]:border-border [&_th]:text-fg [&_th]:border-b [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
        "[&_td]:border-border [&_td]:border-b [&_td]:px-3 [&_td]:py-2",
        className,
      )}
      {...props}
    />
  );
}
