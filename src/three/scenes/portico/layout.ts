/**
 * Where the portico's pieces go, for a given half-span.
 *
 * The model (scripts/blender/portico.py) is authored as modules rather than
 * one beam, because the hero is a different width on every screen. The two
 * pillars stand at the edges of whatever box the page gets, and this decides
 * everything between them:
 *
 *   - the two plain runs of entablature stretch in X. They are extrusions
 *     along X, so stretching them distorts no molding.
 *   - the Greek key, the running scroll, the dentils and the eggs above them
 *     are carvings and must never stretch. They are instanced at true size,
 *     as many whole repeats as fit, with only the spacing flexing (the key
 *     and scroll by a few percent, the dentils not at all).
 *
 * **This is a transcription of `layout()` in the Blender script.** The
 * script uses the same rule to place the pieces for its preview render and
 * for baking the lighting in context. Change one, change the other.
 *
 * Every number here is in the script's space — metres, Z up, fronts facing
 * -Y — because that is where they are written down. `toThree` converts.
 */

export const P = {
  /** Top of both abaci. */
  colTop: 6.7,
  /** Top of the cornice. */
  top: 8.19,
  /** The architrave face, and how far the cornice projects beyond it. */
  entFront: -0.46,
  cornice: 0.535,
  /** End blocks reach this far outboard / inboard of a pillar's centre. */
  endOut: 0.78,
  endIn: 0.78,
  /** Authored lengths of the two stretchable runs. */
  walnutRun: 4.0,
  marbleRun: 6.0,
  /** The console where walnut becomes marble, and where along the span. */
  consoleW: 0.46,
  seamAt: 0.38,
  keyCell: 0.0255,
  keyW: 0.255,
  keyZ: 7.3098,
  dentilP: 0.125,
  dentilZ: 7.68,
  eggY: -0.61,
  eggZ: 7.813,
  waveW: 0.36,
  waveZ: 7.3,
  /** The lit textures store radiance divided by this. */
  litScale: 1.6,
} as const;

/** Half the pillars' footprint plus the capitals' overhang — the pier's
 *  volutes reach 0.54 from its centre, the column's 0.91. */
export const PILLAR_REACH = 0.91;

export const BASE = "/models/portico/";

/** Vertical field of view. Narrow, so verticals stay nearly parallel and the
 *  frame reads as architecture rather than as a wide-angle photo of it. */
export const FOV = 22;
/** Margins around the frame, in metres: room below for the floor shadow,
 *  room above the cornice for the creeper's leaves, a little at the sides. */
export const MARGIN = { bottom: 0.3, top: 0.4, side: 0.08 };

/** Where the camera stands so the frame fills a box of this aspect, and
 *  the half-span that leaves the pillars at its edges. */
export function fitFrame(aspect: number) {
  const tan = Math.tan(((FOV / 2) * Math.PI) / 180);
  const halfH = (P.top + MARGIN.bottom + MARGIN.top) / 2;
  const dist = halfH / tan;
  const centreZ = (P.top + MARGIN.top - MARGIN.bottom) / 2;
  const halfW = halfH * aspect;
  // The cornice's outer corner stands about a metre nearer the camera than
  // the pillars do, so perspective makes it reach further out. Shrink by
  // that much so the corner lands inside the box, not just the pillar.
  const reach = P.endOut + P.cornice;
  const nearer = dist / (dist - (P.cornice - P.entFront));
  const X = Math.max(MIN_HALF_SPAN, halfW / nearer - reach - MARGIN.side);
  return { X, dist, centreZ, halfW, halfH };
}

/**
 * The same fit, in the page's pixels, for a hero box of w x h: how many
 * pixels a metre is at the pillars, and where each pillar's centre falls
 * from the box's left edge. The rails down the page read this so they
 * stand exactly under the pillars.
 */
export function frameMetrics(w: number, h: number) {
  const { X, halfW, halfH } = fitFrame(w / Math.max(h, 1));
  const ppm = h / (2 * halfH);
  return { ppm, pier: (halfW - X) * ppm, column: (halfW + X) * ppm };
}

/** The rail modules stacked down the page under each pillar. */
export const RAIL = {
  len: 1.6,
  hx: 0.15,
  hy: 0.1,
  /** How wide the view each rail draws into is: the rail and its creeper. */
  viewWidth: 1.3,
  /** How far outboard of its pillar's centre each rail stands, toward the
   *  page edge, so it keeps clear of the content column below the hero. */
  outset: 0.9,
} as const;

export type Vec3 = readonly [number, number, number];

/** Script space (Z up, -Y toward the viewer) to three's (Y up, +Z toward). */
export function toThree(x: number, y: number, z: number): Vec3 {
  return [x, z, -y];
}

export type Layout = {
  pier: number;
  column: number;
  walnutRun: { x: number; sx: number };
  console: number;
  marbleRun: { x: number; sx: number };
  key: { xs: number[]; sx: number };
  keyStop: number;
  dentils: number[];
  wave: { xs: number[]; sx: number };
};

export function layout(X: number): Layout {
  const a = -X + P.endIn;
  const b = X - P.endIn;
  const seam = a + P.seamAt * (b - a) - P.consoleW / 2;
  const m0 = seam + P.consoleW;

  // key: whole modules, spacing flexed, a stop bar closing the right end
  const k0 = m0 + 0.08;
  const k1 = b - 0.08 - P.keyCell;
  const keyCount = Math.max(1, Math.floor((k1 - k0) / P.keyW));
  const keySx = (k1 - k0) / (keyCount * P.keyW);

  // dentils, and the eggs above them, on the marble run only
  const span = b - m0;
  const nd = Math.max(1, Math.round(span / P.dentilP));
  const pitch = span / nd;

  // the walnut frieze's running scroll
  const w0 = a + 0.06;
  const w1 = seam - 0.06;
  const nw = Math.max(1, Math.floor((w1 - w0) / P.waveW));
  const waveSx = (w1 - w0) / (nw * P.waveW);

  return {
    pier: -X,
    column: X,
    walnutRun: { x: a, sx: (seam - a) / P.walnutRun },
    console: seam,
    marbleRun: { x: m0, sx: (b - m0) / P.marbleRun },
    key: {
      xs: Array.from({ length: keyCount }, (_, i) => k0 + i * P.keyW * keySx),
      sx: keySx,
    },
    keyStop: k1,
    dentils: Array.from({ length: nd }, (_, i) => m0 + (i + 0.5) * pitch),
    wave: {
      xs: Array.from({ length: nw }, (_, i) => w0 + i * P.waveW * waveSx),
      sx: waveSx,
    },
  };
}

/**
 * The smallest half-span that still leaves room for both runs and the
 * console between the end blocks. Below this the frame would fold into
 * itself, so a box that narrow gets the frame cropped instead.
 */
export const MIN_HALF_SPAN = P.endIn + 2.2;
