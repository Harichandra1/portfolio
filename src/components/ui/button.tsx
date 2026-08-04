import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors " +
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:opacity-90",
        secondary: "bg-bg-subtle text-fg hover:bg-border",
        outline: "border border-border-strong text-fg hover:bg-bg-subtle",
        ghost: "text-fg-muted hover:bg-bg-subtle hover:text-fg",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariants = VariantProps<typeof button>;

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & ButtonVariants) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}

/** Same visuals as Button, but renders a Next.js <Link>. */
export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & ButtonVariants) {
  return <Link className={cn(button({ variant, size }), className)} {...props} />;
}
