"use client";

import { useMemo } from "react";
import { Color } from "three";
import { useTokenValue } from "./use-token-value";

/**
 * Reads a colour token straight out of the CSS custom properties on <html>, so
 * scenes stay in step with the design system instead of hardcoding hex values.
 *
 * Pass a token that holds a hex value (e.g. `--accent-hex`); three.js cannot
 * parse `oklch()`, which is why those mirrors exist in globals.css.
 */
export function useTokenColor(token: `--${string}`, fallback = "#888888") {
  const hex = useTokenValue(token, fallback);
  // Memoise on the hex string so a re-render without a token change doesn't
  // allocate a new three.js Color every time.
  return useMemo(() => new Color(hex), [hex]);
}
