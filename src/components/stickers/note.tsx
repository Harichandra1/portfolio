import { cn } from "@/lib/utils";

/**
 * A handwritten aside — the kind of thing scribbled in a margin rather than
 * set in type. Decorative in tone but real in content, so unlike `Sticker`
 * this stays in the accessibility tree and is readable.
 *
 * Use it sparingly and never for anything load-bearing: if a sentence has to
 * be read for the page to make sense, it belongs in the body font.
 */
export function Note({
  children,
  className,
  arrow,
}: {
  children: React.ReactNode;
  className?: string;
  /** Draws a little hand-drawn arrow pointing at the thing being annotated. */
  arrow?: "left" | "right" | "down";
}) {
  return (
    <span
      className={cn(
        "font-hand text-fg-muted inline-flex items-center gap-2 text-lg leading-tight",
        className,
      )}
    >
      {arrow === "left" ? <ArrowDoodle dir="left" /> : null}
      <span>{children}</span>
      {arrow === "right" ? <ArrowDoodle dir="right" /> : null}
      {arrow === "down" ? <ArrowDoodle dir="down" /> : null}
    </span>
  );
}

function ArrowDoodle({ dir }: { dir: "left" | "right" | "down" }) {
  const rotate = dir === "left" ? "rotate-180" : dir === "down" ? "rotate-90" : "";
  return (
    <svg
      viewBox="0 0 40 20"
      aria-hidden
      className={cn("text-fg-subtle h-4 w-8 shrink-0", rotate)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12c8-6 18-8 34-7" />
      <path d="M29 1l7 4-6 5" />
    </svg>
  );
}
