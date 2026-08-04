"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * `false` during SSR and the hydration pass, `true` afterwards.
 *
 * Use it for UI that genuinely cannot be rendered on the server (e.g. anything
 * that depends on the resolved colour theme). This is the sanctioned form of
 * the old "mounted flag" pattern — no state update inside an effect, and no
 * hydration mismatch.
 */
export function useIsHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
