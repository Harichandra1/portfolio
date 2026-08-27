import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Surface for a card whose whole area is clickable. It provides the positioning
 * context only — the actual link comes from a single <CardTitle> inside it,
 * which stretches over the card. That keeps exactly one anchor in the
 * accessibility tree instead of a real link plus a decoy overlay.
 *
 * Any nested interactive element (tags, external links) needs `relative z-10`
 * to sit above the stretched hit area. Depth comes only from the hairline
 * border + a background-color delta on hover — no shadows anywhere, per
 * CONVENTIONS.md.
 */
export function LinkCard({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"article">) {
  return (
    <article
      className={cn(
        "group border-border bg-bg-elevated relative isolate rounded-(--radius-lg) border p-5",
        "hover:border-border-strong transition-colors duration-(--duration-base)",
        "focus-within:border-accent",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("font-display text-fg text-xl", className)}>
      <Link href={href} className="before:absolute before:inset-0 before:z-0">
        {children}
      </Link>
    </h3>
  );
}
