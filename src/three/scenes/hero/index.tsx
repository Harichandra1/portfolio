"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  ShaderMaterial,
} from "three";
import { useTokenColor } from "@/three/hooks/use-token-color";
import { fragmentShader, vertexShader } from "./shader";

const GRID = 64; // 64 x 64 = 4096 points
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
 * Reference scene: a lattice of points rippling on a sine field, tinted with
 * the site's accent token and drifting with the pointer.
 *
 * It is deliberately asset-free — nothing to download, nothing to 404 — so it
 * proves the whole 3D path (capability gate → shared canvas → view → poster
 * fallback) end to end without an art pipeline.
 */
export default function HeroScene() {
  const group = useRef<Group>(null);
  const material = useRef<ShaderMaterial>(null);
  const accent = useTokenColor("--accent-hex", "#0d93a3");

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
      uSize: { value: 26 },
      uColor: { value: accent },
    }),
    // `accent` is mutated in useFrame rather than recreated, so the uniform
    // object only needs to be built once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state, delta) => {
    if (material.current) {
      material.current.uniforms.uTime.value += delta;
      material.current.uniforms.uColor.value = accent;
    }

    if (group.current) {
      // Ease toward the pointer instead of tracking it rigidly.
      const { x, y } = state.pointer;
      group.current.rotation.y += (x * 0.25 - group.current.rotation.y) * 0.03;
      group.current.rotation.x += (-y * 0.12 + 0.42 - group.current.rotation.x) * 0.03;
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
            blending={AdditiveBlending}
          />
        </points>
      </group>
    </>
  );
}
