"use client";

import { useGLTF, useTexture } from "@react-three/drei";

/**
 * Asset loading is centralised here so that the day you drop in a compressed
 * .glb there is no setup to remember.
 *
 * Pipeline for models:
 *   1. compress:  npx gltf-transform optimize in.glb public/models/out.glb
 *   2. (optional) generate a typed component:
 *      npx gltfjsx public/models/out.glb -o src/three/components/Out.tsx -t
 *   3. load with `useModel("/models/out.glb")`
 */

/** Google's hosted DRACO decoder — avoids vendoring the wasm into /public. */
const DRACO_DECODER_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";

/**
 * Load a .glb/.gltf with DRACO and meshopt decoding already wired up.
 * Suspends, so render it inside a <Suspense> (drei's <View> provides one).
 */
export function useModel(url: string) {
  return useGLTF(url, DRACO_DECODER_PATH, true);
}

/** Preload a model during idle time, e.g. on hover of the link that reveals it. */
useModel.preload = (url: string) => useGLTF.preload(url, DRACO_DECODER_PATH, true);

/**
 * Load textures. Prefer .ktx2 (GPU-compressed) over .png/.jpg for anything
 * large — drei routes .ktx2 through the transcoder automatically.
 */
export { useTexture };
