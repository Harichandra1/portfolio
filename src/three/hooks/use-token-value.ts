"use client";

import { useEffect, useState } from "react";

/**
 * Reads a raw CSS custom property off <html> and re-reads whenever
 * next-themes swaps the `dark` class. The shared primitive behind
 * useTokenColor and useTokenNumber — both just parse this string
 * differently, so the DOM-reading/observing logic lives in one place.
 */
export function useTokenValue(token: `--${string}`, fallback: string) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    const root = document.documentElement;

    const read = () => {
      const next = getComputedStyle(root).getPropertyValue(token).trim();
      if (next) setValue(next);
    };

    read();

    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [token]);

  return value;
}
