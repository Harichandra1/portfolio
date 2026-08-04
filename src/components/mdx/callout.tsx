import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  note: { Icon: Info, className: "border-border bg-bg-subtle" },
  tip: { Icon: Lightbulb, className: "border-accent/40 bg-accent/5" },
  warn: { Icon: AlertTriangle, className: "border-amber-500/40 bg-amber-500/5" },
} as const;

export function Callout({
  type = "note",
  children,
}: {
  type?: keyof typeof variants;
  children: React.ReactNode;
}) {
  const { Icon, className } = variants[type];
  return (
    <div className={cn("my-6 flex gap-3 rounded-lg border p-4 text-sm", className)}>
      <Icon className="text-fg-muted mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">{children}</div>
    </div>
  );
}
