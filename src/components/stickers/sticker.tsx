import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { NEqualsFour, Chai, Duck, Terminal, BookSticker } from "./art";

const art: Record<string, ComponentType> = {
  "n=4": NEqualsFour,
  chai: Chai,
  duck: Duck,
  terminal: Terminal,
  book: BookSticker,
};

export type StickerName = keyof typeof art;

/**
 * A die-cut sticker, stuck onto the page at an angle.
 *
 * Purely decorative — `aria-hidden` and `pointer-events-none`, so it is
 * invisible to assistive tech and can never intercept a click meant for
 * something underneath it. The parent needs `relative`.
 *
 * Placement is by class (`top-*`, `right-*`, `rotate-*`, `w-*`) rather than
 * props, so a sticker can be positioned per-breakpoint at the call site. Most
 * are hidden below `sm` — a phone has no spare margin to stick things in, and
 * a sticker overlapping body copy is worse than no sticker.
 */
export function Sticker({ name, className }: { name: StickerName; className?: string }) {
  const Art = art[name];
  if (!Art) return null;

  return (
    <span aria-hidden className={cn("sticker pointer-events-none absolute", className)}>
      <Art />
    </span>
  );
}
