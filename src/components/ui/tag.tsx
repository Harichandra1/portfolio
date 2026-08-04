import Link from "next/link";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center gap-1 rounded-full border border-border bg-bg-subtle px-2.5 py-0.5 " +
  "font-mono text-xs text-fg-muted";

export function Tag({ className, ...props }: React.ComponentPropsWithoutRef<"span">) {
  return <span className={cn(base, className)} {...props} />;
}

/**
 * A filter pill. Pass `tag: null` for the "All" pill, which clears the filter.
 */
export function TagLink({
  tag,
  basePath,
  count,
  active = false,
  className,
}: {
  tag: string | null;
  basePath: string;
  count?: number;
  active?: boolean;
  className?: string;
}) {
  const href = tag ? `${basePath}?tag=${encodeURIComponent(tag)}` : basePath;

  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        base,
        "hover:border-border-strong hover:text-fg transition-colors",
        active && "border-accent text-fg",
        className,
      )}
    >
      {tag ?? "All"}
      {count !== undefined ? (
        <span className="text-fg-subtle tabular-nums">{count}</span>
      ) : null}
    </Link>
  );
}
