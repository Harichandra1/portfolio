"use client";

import { useEffect, useMemo, useState } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrthographicCamera } from "@react-three/drei";
import {
  BufferAttribute,
  CatmullRomCurve3,
  Color,
  FileLoader,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
  type Texture,
} from "three";
import { useModel, useTexture } from "@/three/loaders";
import { useTokenNumber } from "@/three/hooks/use-token-number";
import { BASE, frameMetrics, P, RAIL } from "./layout";
import { paintMaterial, paintUniforms, railGrow } from "./paint";

/**
 * The rails: the portico continuing down the page.
 *
 * Under each pillar a slim reeded rail — walnut under the pier, marble under
 * the column — runs from the foot of the hero to the end of the page, built
 * from a baked 1.6 m module (scripts/blender/portico.py) stacked as many
 * times as the page is long, a turned collar on every joint. A creeper
 * twists down each one, painted like the ones on the pillars (paint.ts,
 * the same leaf and flower prototypes), and it *grows as you scroll*: the
 * vine reaches a little ahead of the bottom of the viewport and never
 * retreats, so reading down the page draws the creeper down with you.
 *
 * Scale: an orthographic camera at the hero's own pixels-per-metre, so a
 * leaf here is the size of a leaf on the pillar above it. The DOM side
 * (components/sections/portico-rails.tsx) stands each view under its pillar
 * using the same `frameMetrics`.
 */

type Side = "left" | "right";
type Nodes = Record<string, Mesh>;
type CreeperData = { sun: [number, number, number] };

const GREENS = ["#4c6a2b", "#5a7a31", "#3e5926", "#6b8a3a", "#7f9a45", "#56702f"];
const BLOSSOM = ["#f4efe1", "#f1ead8", "#f7f3ea"];
const BUD = "#ebe3cb";
const RACEME = {
  left: { open: ["#f0c02e", "#f4cd3f", "#e9b222"], tip: "#c8b84e", size: 0.075 },
  right: { open: ["#e48fbf", "#d97cb0", "#c983c9"], tip: "#9f3f74", size: 0.062 },
};

/** Pixels per metre in the hero, so the rails match its scale. */
function useHeroScale() {
  const [ppm, setPpm] = useState(100);
  useEffect(() => {
    const hero = document.querySelector("[data-portico-hero]");
    if (!hero) return;
    const measure = () => {
      const r = hero.getBoundingClientRect();
      setPpm(frameMetrics(r.width, r.height).ppm);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(hero);
    return () => ro.disconnect();
  }, []);
  return ppm;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Inst = { m: number[]; c: Color; d: [number, number, number, number] };

/**
 * Grow a creeper down a rail H metres long. Everything is in three's space:
 * the rail stands on the Y axis from 0 down to -H, its face toward +Z.
 * Prototypes grow along their +Y and face +Z.
 */
function growVine(H: number, side: Side) {
  const rand = rng(side === "left" ? 71 : 113);
  const r = (a: number, b: number) => a + (b - a) * rand();
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const rx = RAIL.hx + 0.05;
  const rz = RAIL.hy + 0.05;
  const turn = side === "left" ? 1 : -1;
  const phase = side === "left" ? 0.4 : 2.2;

  const ctrl: Vector3[] = [];
  for (let s = 0; s <= H + 0.1; s += 0.1) {
    const th = phase + (s / 2.6) * Math.PI * 2 * turn;
    const c = Math.cos(th);
    const sn = Math.sin(th);
    ctrl.push(
      new Vector3(
        rx * Math.sign(c) * Math.sqrt(Math.abs(c)) + 0.012 * Math.sin(s * 7.1),
        -s,
        rz * Math.sign(sn) * Math.sqrt(Math.abs(sn)),
      ),
    );
  }
  const curve = new CatmullRomCurve3(ctrl);
  const len = curve.getLength();

  const inst: Record<string, Inst[]> = {
    Proto_Leaf: [],
    Proto_Blossom: [],
    Proto_Bud: [],
    Proto_Floret: [],
  };
  const axes: { curve: CatmullRomCurve3; g: number }[] = [];
  const up = new Vector3(0, 1, 0);

  const place = (
    proto: string,
    pos: Vector3,
    D: Vector3,
    F: Vector3,
    scale: [number, number, number],
    colour: string | Color,
    d: [number, number, number, number],
  ) => {
    const Y = D.clone().normalize();
    const Z = F.clone().sub(Y.clone().multiplyScalar(F.dot(Y)));
    if (Z.lengthSq() < 1e-6) Z.set(0, 0, 1);
    Z.normalize();
    const X = new Vector3().crossVectors(Y, Z).normalize();
    const m = new Matrix4()
      .makeBasis(X, Y, Z)
      .scale(new Vector3(...scale))
      .setPosition(pos);
    inst[proto].push({
      m: m.toArray(),
      c: typeof colour === "string" ? new Color(colour) : colour,
      d,
    });
  };

  const lightAt = (p: Vector3): [number, number] => [
    p.z > -0.03 ? 1 : 0.3,
    p.z > -0.03 ? 0.85 : 0.5,
  ];

  let nextLeaf = 0.05;
  let nextBloom = r(0.4, 0.9);
  let nextRaceme = r(1.8, 2.6);
  let sign = 1;
  for (let s = 0.04; s < len - 0.05; s += 0.02) {
    const u = s / len;
    const p = curve.getPointAt(u);
    const T = curve.getTangentAt(u);
    const out = new Vector3(p.x, 0, p.z).normalize();
    const [sun, sky] = lightAt(p);
    if (s >= nextLeaf) {
      nextLeaf = s + 0.13 * r(0.7, 1.3);
      const n = pick([1, 2, 2, 3]);
      for (let k = 0; k < n; k++) {
        sign = -sign;
        const sideV = new Vector3().crossVectors(T, out).normalize();
        const D = sideV
          .multiplyScalar(0.85 * sign)
          .add(out.clone().multiplyScalar(0.5))
          .add(new Vector3(r(-0.25, 0.25), -0.35 + r(-0.2, 0.2), r(-0.2, 0.2)))
          .add(T.clone().multiplyScalar(0.2));
        const F = out
          .clone()
          .multiplyScalar(0.6)
          .add(new Vector3(0, 0.25, 0.6));
        const sz = r(0.14, 0.22);
        place(
          "Proto_Leaf",
          p.clone().add(D.clone().normalize().multiplyScalar(0.03)),
          D,
          F,
          [sz * r(0.85, 1.1), sz, sz],
          pick(GREENS),
          [0.3 * r(0.7, 1.3), sun, sky, u + 0.004],
        );
      }
    }
    if (s >= nextBloom) {
      nextBloom = s + r(0.6, 1.2);
      const at = p.clone().add(out.clone().multiplyScalar(0.05));
      const F = out
        .clone()
        .multiplyScalar(0.55)
        .add(new Vector3(0, 0.2, 0.8))
        .normalize();
      for (let k = 0; k < pick([1, 2, 2, 3]); k++) {
        const D = up
          .clone()
          .sub(F.clone().multiplyScalar(F.y))
          .applyAxisAngle(F, r(0, Math.PI * 2));
        const jit = k
          ? new Vector3(r(-0.07, 0.07), r(-0.07, 0.07), r(-0.02, 0.02))
          : new Vector3();
        const sz = r(0.11, 0.15);
        place("Proto_Blossom", at.clone().add(jit), D, F, [sz, sz, sz], pick(BLOSSOM), [
          0.15,
          sun,
          sky,
          u + 0.006,
        ]);
      }
      for (let k = 0; k < 2; k++) {
        const off = new Vector3(r(-1, 1), r(-0.6, 1), r(-0.2, 0.6))
          .normalize()
          .multiplyScalar(0.12);
        const sz = r(0.045, 0.06);
        place(
          "Proto_Bud",
          at.clone().add(off),
          off.clone().add(new Vector3(0, 0.3, 0)),
          F,
          [sz, sz, sz],
          BUD,
          [0.2, sun, sky, u + 0.008],
        );
      }
    }
    // every few metres, on the side facing us, a raceme hangs from the vine
    if (s >= nextRaceme && p.z > 0.06) {
      nextRaceme = s + r(4.2, 5.6);
      const spec = RACEME[side];
      const A = p.clone().add(new Vector3(0, -0.02, 0.06));
      const L = r(0.55, 0.8);
      const n = Math.round(L * 80);
      const bend = r(-1, 1);
      const axisAt = (t: number) =>
        A.clone().add(
          new Vector3(0.035 * bend * Math.sin(Math.PI * t * 0.9), -L * t, 0.05 * t),
        );
      axes.push({
        curve: new CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => axisAt(i / 12))),
        g: u,
      });
      const tip = new Color(spec.tip);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const ph = i * 2.39996;
        const Rr = new Vector3(Math.cos(ph), 0, Math.sin(ph));
        const rr = (0.05 * (1 - 0.55 * t) + 0.006) * (spec.size / 0.05);
        const F = Rr.clone()
          .multiplyScalar(0.8)
          .add(new Vector3(0, -0.2, 0.55))
          .normalize();
        const D = up
          .clone()
          .sub(F.clone().multiplyScalar(F.y * 0.6))
          .add(Rr.clone().multiplyScalar(0.25));
        const sz = spec.size * (1 - 0.5 * t) * r(0.85, 1.1);
        const g = Math.min(1, u + 0.01 + 0.02 * t);
        if (t < 0.8) {
          const col = new Color(pick(spec.open)).lerp(tip, 0.3 * t);
          place(
            "Proto_Floret",
            axisAt(t).add(Rr.multiplyScalar(rr)),
            D,
            F,
            [sz, sz, sz],
            col,
            [0.15 + 0.85 * t, 0.9, 0.85, g],
          );
        } else {
          place(
            "Proto_Bud",
            axisAt(t).add(Rr.multiplyScalar(rr * 0.6)),
            D.sub(new Vector3(0, 0.8, 0)),
            F,
            [sz * 0.55, sz * 0.55, sz * 0.55],
            tip,
            [0.15 + 0.85 * t, 0.9, 0.85, g],
          );
        }
      }
      for (let k = 0; k < 3; k++) {
        const a = (-40 + 40 * k) * (Math.PI / 180);
        const D = new Vector3(Math.sin(a), -0.7 + 0.3 * Math.cos(a), 0.5);
        place(
          "Proto_Leaf",
          A.clone(),
          D,
          new Vector3(0, 0.2, 1),
          [0.14, 0.21, 0.21],
          pick(GREENS),
          [0.35, 1, 0.85, u],
        );
      }
    }
  }

  // the stems: the vine, a thinner one twisting round it, the raceme axes
  const stemGeo = (
    c: CatmullRomCurve3,
    radius: number,
    g0: number,
    g1: number,
    sway0: number,
    sway1: number,
  ) => {
    const segs = Math.max(8, Math.round(c.getLength() / 0.035));
    const radial = 6;
    const geo = new TubeGeometry(c, segs, radius, radial, false);
    const pos = geo.getAttribute("position");
    const col = new Float32Array(pos.count * 4);
    for (let k = 0; k < pos.count; k++) {
      const i = Math.floor(k / (radial + 1));
      const u = i / segs;
      const front = pos.getZ(k) > -0.03;
      col.set(
        [
          sway0 + (sway1 - sway0) * u,
          front ? 1 : 0.3,
          front ? 0.85 : 0.5,
          g0 + (g1 - g0) * u,
        ],
        k * 4,
      );
    }
    geo.setAttribute("color", new BufferAttribute(col, 4));
    return geo;
  };
  const stems: BufferGeometry[] = [stemGeo(curve, 0.026, 0, 1, 0, 0)];
  const twist: Vector3[] = [];
  for (let s = 0; s <= len; s += 0.04) {
    const u = s / len;
    const p = curve.getPointAt(u);
    const a = (s / 0.55) * Math.PI * 2;
    twist.push(p.add(new Vector3(Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04)));
  }
  stems.push(stemGeo(new CatmullRomCurve3(twist), 0.012, 0, 1, 0, 0));
  for (const { curve: c, g } of axes)
    stems.push(stemGeo(c, 0.007, g, Math.min(1, g + 0.02), 0.05, 1));

  return { inst, stems };
}

export function RailScene({ side }: { side: Side }) {
  const { nodes } = useModel(`${BASE}creepers.glb`) as unknown as { nodes: Nodes };
  const data = useLoader(FileLoader, `${BASE}creepers.json`, (l) =>
    l.setResponseType("json"),
  ) as unknown as CreeperData;
  const tex = useTexture(
    `${BASE}${side === "left" ? "rail_wood" : "rail_stone"}.webp`,
    (t) => {
      const list = Array.isArray(t) ? t : [t];
      for (const x of list) {
        x.flipY = false;
        x.colorSpace = SRGBColorSpace;
        x.anisotropy = 4;
        x.needsUpdate = true;
      }
    },
  ) as Texture;
  const exposure = useTokenNumber("--portico-exposure", 1);
  const gloss = useTokenNumber("--portico-gloss", 0.55);
  const size = useThree((s) => s.size);
  const ppm = useHeroScale();

  const H = size.height / ppm;
  // regenerate only when the page grows or shrinks by whole metres
  const Hq = Math.ceil(H);

  const railMat = useMemo<Material>(() => {
    const common = {
      color: new Color(0, 0, 0),
      emissive: new Color(1, 1, 1),
      emissiveMap: tex,
      emissiveIntensity: P.litScale * exposure,
      metalness: 0,
      envMapIntensity: gloss,
    };
    return side === "left"
      ? new MeshPhysicalMaterial({
          ...common,
          roughness: 0.42,
          clearcoat: 0.5,
          clearcoatRoughness: 0.22,
        })
      : new MeshStandardMaterial({ ...common, roughness: 0.5 });
  }, [tex, exposure, gloss, side]);

  const paint = useMemo(
    () => ({
      stem: paintMaterial({ stem: true, sun: data.sun, exposure, grow: railGrow[side] }),
      bloom: paintMaterial({
        stem: false,
        sun: data.sun,
        exposure,
        grow: railGrow[side],
      }),
    }),
    [data.sun, exposure, side],
  );

  const rail = useMemo(() => {
    const node = nodes.Rail;
    const n = Math.ceil(Hq / RAIL.len) + 1;
    const mesh = new InstancedMesh(node.geometry, railMat, n);
    const local = new Matrix4().compose(node.position, node.quaternion, node.scale);
    const m = new Matrix4();
    for (let i = 0; i < n; i++) {
      mesh.setMatrixAt(i, m.makeTranslation(0, -(i + 1) * RAIL.len, 0).multiply(local));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    return mesh;
  }, [nodes, railMat, Hq]);

  const plant = useMemo(() => {
    const { inst, stems } = growVine(Hq, side);
    const meshes: (Mesh | InstancedMesh)[] = stems.map((g) => new Mesh(g, paint.stem));
    for (const [proto, items] of Object.entries(inst)) {
      const node = nodes[proto];
      if (!node || items.length === 0) continue;
      const geometry = node.geometry.clone();
      const local = new Matrix4().compose(node.position, node.quaternion, node.scale);
      const im = new InstancedMesh(geometry, paint.bloom, items.length);
      const extra = new Float32Array(items.length * 4);
      const m = new Matrix4();
      items.forEach((it, i) => {
        im.setMatrixAt(i, m.fromArray(it.m).multiply(local));
        im.setColorAt(i, it.c);
        extra.set(it.d, i * 4);
      });
      geometry.setAttribute("aData", new InstancedBufferAttribute(extra, 4));
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      meshes.push(im);
    }
    return meshes;
  }, [Hq, side, nodes, paint]);

  useEffect(
    () => () => {
      rail.dispose();
      railMat.dispose();
    },
    [rail, railMat],
  );
  useEffect(
    () => () => {
      for (const m of plant) {
        m.geometry.dispose();
        if (m instanceof InstancedMesh) m.dispose();
      }
      paint.stem.dispose();
      paint.bloom.dispose();
    },
    [plant, paint],
  );

  useFrame((state) => {
    paintUniforms.uTime.value = state.clock.elapsedTime;
    // grow to just below the bottom of the viewport, and never back
    const el = document.getElementById(`portico-rail-${side}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const reach = (window.innerHeight * 0.92 - rect.top) / Math.max(rect.height, 1);
    const target = Math.min(1, Math.max(0, reach)) * (H / Hq);
    const g = railGrow[side];
    if (target > g.value) g.value += Math.max(0.0005, (target - g.value) * 0.06);
  });

  return (
    <>
      <OrthographicCamera
        makeDefault
        zoom={ppm}
        position={[0, -H / 2, 20]}
        near={0.1}
        far={100}
      />
      <Environment resolution={64} frames={1}>
        <Lightformer
          intensity={2.2}
          position={[-6, 7, 7]}
          scale={[8, 5, 1]}
          color="#fff3e2"
        />
        <Lightformer
          intensity={0.9}
          position={[7, 3, 6]}
          scale={[5, 9, 1]}
          color="#eef1f5"
        />
      </Environment>
      <directionalLight position={[-5, 6.2, 6.2]} intensity={1.1} color="#fff1dc" />
      <primitive object={rail} />
      {plant.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </>
  );
}
