"use client";

import { useEffect, useState } from "react";
import { Color } from "three";

/**
 * Reads a colour token straight out of the CSS custom properties on <html>, so
 * scenes stay in step with the design system instead of hardcoding hex values.
 * Re-reads whenever next-themes swaps the `dark` class.
 *
 * Pass a token that holds a hex value (e.g. `--accent-hex`); three.js cannot
 * parse `oklch()`, which is why those mirrors exist in globals.css.
 */
export function useTokenColor(token: `--${string}`, fallback = "#888888") {
  const [color, setColor] = useState(() => new Color(fallback));

  useEffect(() => {
    const root = document.documentElement;

    const read = () => {
      const value = getComputedStyle(root).getPropertyValue(token).trim();
      if (value) setColor(new Color(value));
    };

    read();

    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [token]);

  return color;
}
