"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import {
  Color,
  FileLoader,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type Material,
  type Mesh,
  type PerspectiveCamera as PerspectiveCameraImpl,
  type Texture,
} from "three";
import { useModel, useTexture } from "@/three/loaders";
import { useTokenNumber } from "@/three/hooks/use-token-number";
import { BASE, FOV, fitFrame, layout, P, toThree, type Vec3 } from "./layout";
import { paintMaterial, paintUniforms } from "./paint";

/**
 * The portico — a carved walnut pier and a fluted marble Ionic column
 * carrying an entablature that turns from wood to stone at a console.
 *
 * Modelled procedurally in Blender (scripts/blender/portico.py), not in
 * code here, for the reason the engine scene gives in reverse: this is a
 * piece of carving, a quarter of a million triangles of leaves, volutes and
 * flutes, and none of it moves. Code-built primitives could not get there.
 *
 * ## How it is lit
 *
 * The lighting is baked. Cycles rendered every surface under a low warm sun
 * and a soft sky, with a floor bouncing light back up into the soffits, and
 * stored the result — albedo times light, with every shadow and every bit of
 * occlusion in the carving — as the *emissive* texture. The materials have a
 * black base colour, so nothing here lights them diffusely a second time.
 *
 * What the bake can't hold is gloss, because gloss depends on where you are
 * standing. So the materials keep their roughness maps and a studio of light
 * cards to reflect, and the walnut has a lacquer clearcoat: as the camera
 * drifts with the pointer the sheen moves across the polished wood and the
 * marble, while the shading underneath stays put, as it would on a real
 * object under fixed light.
 *
 * ## Fitting the frame to the box
 *
 * The pillars stand at the edges of whatever box the page gives this view,
 * and `layout()` fills the span between them — see layout.ts. Nothing is
 * scaled to fit: the camera is placed so the frame's height fills the box,
 * and the span grows or shrinks with the box's width.
 *
 * Like the engine, the finishes do not follow the theme — walnut is walnut.
 * `--portico-*` in globals.css sets how bright it is and how much it shines.
 */

const MODEL = `${BASE}portico.glb`;

const TEXTURES = {
  pier: `${BASE}pier.webp`,
  pierRough: `${BASE}pier_rough.webp`,
  column: `${BASE}column.webp`,
  columnRough: `${BASE}column_rough.webp`,
  stone: `${BASE}stone.webp`,
  stoneRough: `${BASE}stone_rough.webp`,
  wood: `${BASE}wood.webp`,
  woodRough: `${BASE}wood_rough.webp`,
  shadowPier: `${BASE}shadow_pilaster.webp`,
  shadowColumn: `${BASE}shadow_column.webp`,
} as const;

type TextureSet = Record<keyof typeof TEXTURES, Texture>;

export function prepare(loaded: Texture | Texture[] | Readonly<Record<string, Texture>>) {
  // drei hands back whatever shape it was given: here, the keyed map.
  const list: Texture[] = Array.isArray(loaded)
    ? loaded
    : (loaded as Texture).isTexture
      ? [loaded as Texture]
      : Object.values(loaded as Record<string, Texture>);
  for (const t of list) {
    // The UVs come from glTF, whose V axis runs the other way.
    t.flipY = false;
    t.anisotropy = 4;
    const path = (t.image as { src?: string } | undefined)?.src ?? "";
    t.colorSpace = /_rough|shadow_/.test(path) ? NoColorSpace : SRGBColorSpace;
    t.needsUpdate = true;
  }
}

function makeMaterials(tex: TextureSet, exposure: number, gloss: number, shadow: number) {
  const intensity = P.litScale * exposure;
  const baked = (lit: Texture, rough: Texture) =>
    new MeshStandardMaterial({
      color: new Color(0, 0, 0),
      emissive: new Color(1, 1, 1),
      emissiveMap: lit,
      emissiveIntensity: intensity,
      roughness: 1,
      roughnessMap: rough,
      metalness: 0,
      envMapIntensity: gloss,
    });
  const lacquered = (lit: Texture, rough: Texture) =>
    new MeshPhysicalMaterial({
      color: new Color(0, 0, 0),
      emissive: new Color(1, 1, 1),
      emissiveMap: lit,
      emissiveIntensity: intensity,
      roughness: 1,
      roughnessMap: rough,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.22,
      envMapIntensity: gloss,
    });
  const floor = (map: Texture) =>
    new MeshBasicMaterial({
      color: new Color("#2a1d14"),
      alphaMap: map,
      transparent: true,
      opacity: shadow,
      depthWrite: false,
    });
  return {
    pier: lacquered(tex.pier, tex.pierRough),
    column: baked(tex.column, tex.columnRough),
    stone: baked(tex.stone, tex.stoneRough),
    wood: lacquered(tex.wood, tex.woodRough),
    shadowPier: floor(tex.shadowPier),
    shadowColumn: floor(tex.shadowColumn),
  };
}

type Nodes = Record<string, Mesh>;

export default function PorticoScene() {
  const { nodes } = useModel(MODEL) as unknown as { nodes: Nodes };
  const tex = useTexture(TEXTURES, prepare) as TextureSet;
  const size = useThree((s) => s.size);
  const exposure = useTokenNumber("--portico-exposure", 1);
  const gloss = useTokenNumber("--portico-gloss", 0.55);
  const shadow = useTokenNumber("--portico-shadow", 0.6);

  const fit = useMemo(
    () => fitFrame(size.width / Math.max(size.height, 1)),
    [size.width, size.height],
  );
  const L = useMemo(() => layout(fit.X), [fit.X]);
  const rows = useMemo(
    () => ({
      key: L.key.xs.map((x) => toThree(x, P.entFront - 0.02, P.keyZ)),
      dentil: L.dentils.map((x) => toThree(x, P.entFront - 0.08, P.dentilZ)),
      egg: L.dentils.map((x) => toThree(x, P.eggY, P.eggZ)),
      wave: L.wave.xs.map((x) => toThree(x, P.entFront - 0.02, P.waveZ)),
    }),
    [L],
  );

  // Materials are rebuilt (rarely: on a theme toggle) rather than mutated,
  // because the React Compiler rightly refuses to let a memoised value be
  // written to later. Old ones are disposed; the textures are shared and
  // owned by drei's cache, so they are not.
  const mat = useMemo(
    () => makeMaterials(tex, exposure, gloss, shadow),
    [tex, exposure, gloss, shadow],
  );
  useEffect(
    () => () => {
      for (const m of Object.values(mat)) m.dispose();
    },
    [mat],
  );

  const camera = useRef<PerspectiveCameraImpl>(null);
  const start = useRef<number | null>(null);

  useFrame((state) => {
    const cam = camera.current;
    if (!cam) return;
    if (start.current === null) start.current = state.clock.elapsedTime;
    // Arrive: a slow dolly in over the first two seconds, eased out.
    const t = Math.min(1, (state.clock.elapsedTime - start.current) / 2.2);
    const arrive = 1 - Math.pow(1 - t, 3);
    const dist = fit.dist * (1 + 0.1 * (1 - arrive));
    // Then drift with the pointer — translate only, never rotate, so the
    // verticals stay vertical. The sheen moving over the wood is the point.
    const { x, y } = state.pointer;
    const tx = x * 0.32;
    const ty = fit.centreZ + y * 0.14;
    cam.position.x += (tx - cam.position.x) * 0.045;
    cam.position.y += (ty - cam.position.y) * 0.045;
    cam.position.z = dist;

    // The creepers grow in behind the dolly, base to tip, over four seconds,
    // and then stir in a slow wind.
    paintUniforms.uTime.value = state.clock.elapsedTime;
    const g = Math.min(
      1,
      Math.max(0, (state.clock.elapsedTime - start.current - 0.5) / 4),
    );
    paintUniforms.uGrow.value = 1 - Math.pow(1 - g, 2);
  });

  const at = (x: number, y = 0, z = 0) => toThree(x, y, z);
  // Each mesh keeps its own node transform: meshopt compression quantizes
  // positions and moves the dequantizing scale and offset onto the node.
  const piece = (name: string, material: Material) => {
    const n = nodes[name];
    return (
      <mesh
        geometry={n.geometry}
        material={material}
        position={n.position}
        quaternion={n.quaternion}
        scale={n.scale}
      />
    );
  };

  return (
    <>
      <PerspectiveCamera
        ref={camera}
        makeDefault
        fov={FOV}
        near={1}
        far={80}
        position={[0, fit.centreZ, fit.dist * 1.1]}
      />

      {/*
        Light cards for the gloss to reflect, rendered once into a small cube
        map. They sit roughly where the bake's sun and sky were, so a
        highlight never appears on a face the baked light left in shadow.
      */}
      <Environment resolution={128} frames={1}>
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
        <Lightformer
          intensity={0.7}
          position={[0, 10, 2]}
          rotation-x={Math.PI / 2}
          scale={[14, 4, 1]}
        />
        <Lightformer
          intensity={0.5}
          position={[0, -2, 8]}
          scale={[16, 2, 1]}
          color="#f4ead9"
        />
      </Environment>
      <directionalLight position={[-5, 6.2, 6.2]} intensity={1.1} color="#fff1dc" />

      <Creepers pier={at(L.pier)} column={at(L.column)} exposure={exposure} />

      {/* ---- pillars, each standing in its own baked floor shadow ---- */}
      <group position={at(L.pier)}>
        {piece("Pilaster", mat.pier)}
        {piece("Pilaster_Shadow", mat.shadowPier)}
        {piece("Ent_WalnutEnd", mat.wood)}
      </group>
      <group position={at(L.column)}>
        {piece("Column", mat.column)}
        {piece("Column_Shadow", mat.shadowColumn)}
        {piece("Ent_MarbleEnd", mat.stone)}
      </group>

      {/* ---- the entablature between them ---- */}
      <group position={at(L.walnutRun.x)} scale={[L.walnutRun.sx, 1, 1]}>
        {piece("Ent_WalnutRun", mat.wood)}
      </group>
      <group position={at(L.console)}>{piece("Ent_Console", mat.stone)}</group>
      <group position={at(L.marbleRun.x)} scale={[L.marbleRun.sx, 1, 1]}>
        {piece("Ent_MarbleRun", mat.stone)}
      </group>
      <group position={at(L.keyStop, P.entFront - 0.02, P.keyZ)}>
        {piece("KeyStop", mat.stone)}
      </group>

      {/* ---- carvings, at true size: only their spacing flexes ---- */}
      <Instanced node={nodes.Key} material={mat.stone} at={rows.key} sx={L.key.sx} />
      <Instanced node={nodes.Dentil} material={mat.stone} at={rows.dentil} />
      <Instanced node={nodes.Egg} material={mat.stone} at={rows.egg} />
      <Instanced node={nodes.Wave} material={mat.wood} at={rows.wave} sx={L.wave.sx} />
    </>
  );
}

/**
 * One draw call for every repeat of a carving.
 *
 * Built whole in a memo rather than as `<instancedMesh args>` plus an effect
 * that writes the matrices: r3f rebuilds an instancedMesh whenever its args
 * change (a material swap on a theme toggle, a count change on resize), and
 * the rebuilt one came back with identity matrices — every key and dentil
 * stacked at the origin. Here the matrices travel with the object.
 */
function Instanced({
  node,
  material,
  at,
  sx = 1,
}: {
  node: Mesh;
  material: Material;
  at: Vec3[];
  sx?: number;
}) {
  const mesh = useMemo(() => {
    const im = new InstancedMesh(node.geometry, material, at.length);
    // placement x the node's own (dequantizing) transform
    const local = new Matrix4().compose(node.position, node.quaternion, node.scale);
    const m = new Matrix4();
    const q = new Quaternion();
    const s = new Vector3(sx, 1, 1);
    const p = new Vector3();
    at.forEach((pos, i) => {
      m.compose(p.set(pos[0], pos[1], pos[2]), q, s).multiply(local);
      im.setMatrixAt(i, m);
    });
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    return im;
  }, [node, material, at, sx]);
  useEffect(() => () => mesh.dispose(), [mesh]);

  return <primitive object={mesh} />;
}

/**
 * The creepers: a liana up each pillar and along the cornice, with blossom,
 * laburnum and wisteria — drawn in paint (see paint.ts). Each pillar's plant
 * travels with its pillar; nothing here depends on the span.
 *
 * Stems are meshes. Leaves and flowers are four prototype meshes instanced
 * from creepers.json, whose records are: a three-space matrix (16, column
 * major), a linear colour (3), and sway, sun, sky and grow.
 */
const CREEPERS = `${BASE}creepers.glb`;
const CREEPER_DATA = `${BASE}creepers.json`;

type CreeperData = {
  stride: number;
  sun: [number, number, number];
  groups: Record<"pier" | "column", Record<string, number[]>>;
};

function Creepers({
  pier,
  column,
  exposure,
}: {
  pier: Vec3;
  column: Vec3;
  exposure: number;
}) {
  const { nodes } = useModel(CREEPERS) as unknown as { nodes: Nodes };
  const data = useLoader(FileLoader, CREEPER_DATA, (l) =>
    l.setResponseType("json"),
  ) as unknown as CreeperData;

  const mat = useMemo(
    () => ({
      stem: paintMaterial({ stem: true, sun: data.sun, exposure }),
      bloom: paintMaterial({ stem: false, sun: data.sun, exposure }),
    }),
    [data.sun, exposure],
  );
  useEffect(
    () => () => {
      mat.stem.dispose();
      mat.bloom.dispose();
    },
    [mat],
  );

  const plants = useMemo(() => {
    const build = (group: Record<string, number[]>) =>
      Object.entries(group)
        .filter(([proto, flat]) => nodes[proto] && flat.length > 0)
        .map(([proto, flat]) => {
          const node = nodes[proto];
          const n = flat.length / data.stride;
          const geometry = node.geometry.clone();
          const local = new Matrix4().compose(node.position, node.quaternion, node.scale);
          const mesh = new InstancedMesh(geometry, mat.bloom, n);
          const extra = new Float32Array(n * 4);
          const m = new Matrix4();
          const c = new Color();
          for (let i = 0; i < n; i++) {
            const o = i * data.stride;
            mesh.setMatrixAt(i, m.fromArray(flat, o).multiply(local));
            mesh.setColorAt(i, c.setRGB(flat[o + 16], flat[o + 17], flat[o + 18]));
            extra.set(flat.slice(o + 19, o + 23), i * 4);
          }
          geometry.setAttribute("aData", new InstancedBufferAttribute(extra, 4));
          mesh.instanceMatrix.needsUpdate = true;
          mesh.computeBoundingSphere();
          return mesh;
        });
    return { pier: build(data.groups.pier), column: build(data.groups.column) };
  }, [nodes, data, mat.bloom]);
  useEffect(
    () => () => {
      for (const m of [...plants.pier, ...plants.column]) {
        m.geometry.dispose();
        m.dispose();
      }
    },
    [plants],
  );

  const stem = (name: string) => {
    const n = nodes[name];
    return (
      <mesh
        geometry={n.geometry}
        material={mat.stem}
        position={n.position}
        quaternion={n.quaternion}
        scale={n.scale}
      />
    );
  };

  return (
    <>
      <group position={pier}>
        {stem("Vine_Pier")}
        {plants.pier.map((m) => (
          <primitive key={m.uuid} object={m} />
        ))}
      </group>
      <group position={column}>
        {stem("Vine_Column")}
        {plants.column.map((m) => (
          <primitive key={m.uuid} object={m} />
        ))}
      </group>
    </>
  );
}
