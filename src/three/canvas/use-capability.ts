"use client";

import { useSyncExternalStore } from "react";
import { detectCapability, type Capability } from "./capability";

/**
 * Capability detection as an external store rather than state-in-an-effect.
 *
 * `useSyncExternalStore` is the right shape here: the server renders the
 * disabled snapshot (so the HTML always contains the poster), React swaps in
 * the real value after hydration, and toggling the OS reduced-motion setting
 * re-runs detection live instead of needing a reload.
 */

/** What the server and the pre-hydration client always see. */
const SERVER_SNAPSHOT: Capability = { enabled: false, reason: "no-webgl", maxDpr: 1 };

// getSnapshot must return a referentially stable value or React loops forever,
// so the detection result is cached until something invalidates it.
let cached: Capability | null = null;
const listeners = new Set<() => void>();
let mediaQuery: MediaQueryList | null = null;

function handleChange() {
  cached = null;
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);

  if (!mediaQuery) {
    mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQuery.addEventListener("change", handleChange);
  }

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && mediaQuery) {
      mediaQuery.removeEventListener("change", handleChange);
      mediaQuery = null;
    }
  };
}

function getSnapshot(): Capability {
  cached ??= detectCapability();
  return cached;
}

function getServerSnapshot(): Capability {
  return SERVER_SNAPSHOT;
}

export function useCapability(): Capability {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
