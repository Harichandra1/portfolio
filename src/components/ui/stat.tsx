import { cn } from "@/lib/utils";

/**
 * A mono numeral + label pair for a claimed result. `note` is required, not
 * optional — it's where the sample size or caveat lives (e.g. "n=4,
 * multi-turn"), and making it structural means a number can't ship without
 * its qualifier traveling with it. See CONVENTIONS.md's honesty rule.
 */
export function Stat({
  value,
  label,
  note,
  className,
}: {
  value: string;
  label: string;
  note: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-fg font-mono text-3xl tabular-nums">{value}</span>
      <span className="text-fg-muted text-sm">{label}</span>
      <span className="text-2xs text-fg-subtle font-mono tracking-wide uppercase">
        {note}
      </span>
    </div>
  );
}
