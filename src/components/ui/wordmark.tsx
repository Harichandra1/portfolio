import { cn } from "@/lib/utils";

/**
 * Typographic identity — no photo, so this mark is the whole visual brand.
 * Serif initial against a mono full name, reused in the header and the OG
 * image so the two never drift out of sync.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className="font-display text-fg text-2xl leading-none">H</span>
      {/* Full name hides below sm: — the header has no room for it next to
          four nav items on a narrow viewport, and a wrapped mid-word name
          reads as broken rather than restrained. */}
      <span className="text-2xs text-fg-muted hidden font-mono tracking-wide whitespace-nowrap uppercase sm:inline">
        Hari Chandra
      </span>
    </span>
  );
}
