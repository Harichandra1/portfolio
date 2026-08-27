import { cn } from "@/lib/utils";

/**
 * Shared section heading rhythm — mono uppercase eyebrow, hairline rule
 * below. Replaces the `text-fg-subtle mb-6 text-sm uppercase` snippet that
 * used to be duplicated across about/now/entry-showcase.
 */
export function SectionHeading({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border mb-8 flex items-baseline justify-between gap-4 border-b pb-3",
        className,
      )}
    >
      <h2 className="text-fg-subtle font-mono text-xs tracking-wide uppercase">
        {children}
      </h2>
      {action}
    </div>
  );
}
