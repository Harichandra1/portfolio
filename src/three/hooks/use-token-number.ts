"use client";

import { useTokenValue } from "./use-token-value";

/** Reads a numeric CSS custom property, e.g. `--scene-opacity: 0.5;`. */
export function useTokenNumber(token: `--${string}`, fallback: number) {
  const raw = useTokenValue(token, String(fallback));
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}
