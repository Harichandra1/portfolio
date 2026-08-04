/**
 * Decides whether this device should run WebGL at all.
 *
 * The site must be fully usable with 3D switched off, so every scene ships a
 * static poster image and this gate decides which one the visitor gets. Called
 * only on the client — it touches `window` and `navigator`.
 */

export type Capability = {
  /** Safe to mount the shared <Canvas>. */
  enabled: boolean;
  /** Why it was disabled — useful when debugging in the console. */
  reason?: "no-webgl" | "reduced-motion" | "low-memory" | "save-data";
  /** Upper bound for device pixel ratio. Capped to keep fill rate sane. */
  maxDpr: number;
};

const DISABLED = (reason: NonNullable<Capability["reason"]>): Capability => ({
  enabled: false,
  reason,
  maxDpr: 1,
});

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

type NetworkInformation = { saveData?: boolean };

export function detectCapability(): Capability {
  if (typeof window === "undefined") return DISABLED("no-webgl");

  // A visitor asking for reduced motion has opted out of exactly this kind of
  // thing. Honour it before spending anything on feature detection.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return DISABLED("reduced-motion");
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: NetworkInformation;
  };

  if (nav.connection?.saveData) return DISABLED("save-data");

  // `deviceMemory` is Chromium-only and reports in GiB, rounded down to a
  // power of two. Absent elsewhere, so only act when it's present and low.
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) {
    return DISABLED("low-memory");
  }

  if (!hasWebGL2()) return DISABLED("no-webgl");

  // Retina displays gain little visually above 2x but cost 4x the fragments.
  return { enabled: true, maxDpr: Math.min(window.devicePixelRatio || 1, 2) };
}
