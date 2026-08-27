"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  NormalBlending,
  ShaderMaterial,
} from "three";
import { useTokenColor } from "@/three/hooks/use-token-color";
import { useTokenNumber } from "@/three/hooks/use-token-number";
import { fragmentShader, vertexShader } from "./shader";

const GRID = 48; // 48 x 48 = 2,304 points — a quieter field than the original 4,096
const SPREAD = 16;

/**
 * Deterministic pseudo-random in [0, 1) — the classic GLSL sine hash.
 * Used instead of Math.random() so the geometry is identical on every render
 * and every machine, which keeps the build reproducible.
 */
function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * The hero's signature scene: a lattice of points rippling on a sine field,
 * drifting gently with the pointer.
 *
 * Deliberately restrained, not a particle background: it reads its own
 * `--scene-*` tokens (ink-toned, decoupled from `--accent` — see
 * CONVENTIONS.md's one-accent-per-viewport rule) rather than the accent
 * color, uses `AdditiveBlending` only on dark backgrounds where it can
 * actually brighten something, and `NormalBlending` on light backgrounds
 * where additive blending mathematically cannot darken or tint an
 * already-near-white surface — that mismatch, not a tuning problem, is why
 * this scene used to vanish in light mode.
 *
 * It's also asset-free — nothing to download, nothing to 404 — so it proves
 * the whole 3D path (capability gate → shared canvas → view → poster
 * fallback) end to end without an art pipeline.
 */
export default function HeroScene() {
  const group = useRef<Group>(null);
  const material = useRef<ShaderMaterial>(null);
  const sceneColor = useTokenColor("--scene-color-hex", "#514c46");
  const opacity = useTokenNumber("--scene-opacity", 0.5);
  const additive = useTokenNumber("--scene-additive", 0) >= 0.5;

  const geometry = useMemo(() => {
    const count = GRID * GRID;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const x = i % GRID;
      const z = Math.floor(i / GRID);

      positions[i * 3] = (x / (GRID - 1) - 0.5) * SPREAD;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (z / (GRID - 1) - 0.5) * SPREAD;

      // Slight size variance stops the grid reading as mechanical.
      scales[i] = 0.6 + hash(i) * 0.8;
    }

    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    geo.setAttribute("aScale", new BufferAttribute(scales, 1));
    return geo;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 22 },
      uColor: { value: sceneColor },
      uOpacity: { value: opacity },
    }),
    // `sceneColor`/`opacity` are pushed into the uniforms in useFrame rather
    // than recreating this object, so it only needs to be built once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, delta) => {
    if (material.current) {
      // Slower than a 1:1 clock — a quiet drift, not an obviously "live"
      // animation loop.
      material.current.uniforms.uTime.value += delta * 0.55;
      material.current.uniforms.uColor.value = sceneColor;
      material.current.uniforms.uOpacity.value = opacity;
      // A plain property assignment — blending is GL draw-call state, not
      // baked into the compiled program, so this needs no `needsUpdate`
      // or recompilation, just the correct value each frame.
      material.current.blending = additive ? AdditiveBlending : NormalBlending;
    }

    if (group.current) {
      // Ease toward the pointer, gently — a signature, not a toy.
      const { x, y } = state.pointer;
      group.current.rotation.y += (x * 0.12 - group.current.rotation.y) * 0.02;
      group.current.rotation.x += (-y * 0.06 + 0.42 - group.current.rotation.x) * 0.02;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3.4, 9]} fov={42} />
      <group ref={group}>
        <points geometry={geometry}>
          <shaderMaterial
            ref={material}
            uniforms={uniforms}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            transparent
            depthWrite={false}
            blending={additive ? AdditiveBlending : NormalBlending}
          />
        </points>
      </group>
    </>
  );
}
