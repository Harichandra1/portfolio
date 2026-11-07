import { Color, DoubleSide, ShaderMaterial, Vector3 } from "three";
import { glsl } from "@/three/shaders/glsl";

/**
 * The creepers' material: an oil painting, not a photograph.
 *
 * The pillars are carved and lit by a baked Cycles render; the plant
 * growing over them is *painted onto* that, the way a botanical plate or an
 * old still life lays foliage in:
 *
 *   - light is blocked in as a few values — umber shadow, half tone, local
 *     colour, a warm highlight — rather than a smooth gradient;
 *   - the boundaries between them are broken by long brush strokes that run
 *     along each leaf and petal (their UVs) and down each stem;
 *   - turning edges go darker, as a painter's contour does;
 *   - a faint canvas weave sits under everything, and the whole is pulled
 *     toward the yellow of old varnish.
 *
 * The light itself agrees with the bake: the same sun direction, and per
 * leaf (or per stem point) how much of the sun and the sky the architecture
 * leaves it — ray cast in Blender and shipped with the instances — so a leaf
 * round the back of the column is in shade, as the column behind it is.
 *
 * `paintUniforms` is shared, module-level, and written every frame by the
 * scene: time (for the sway) and growth (the creeper growing in on load).
 */
export const paintUniforms = {
  uTime: { value: 0 },
  uGrow: { value: 0 },
};

const noise = glsl`
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return s;
  }
`;

const vertexShader = glsl`
  uniform float uTime;
  uniform float uGrow;
  #ifndef STEM
    attribute vec4 aData; // sway, sun, sky, grow
  #endif
  varying vec3 vN;
  varying vec3 vW;
  varying vec2 vUv;
  varying vec3 vTint;
  varying vec3 vLight; // sun, sky, visible
  varying float vSeed;

  void main() {
    #if defined(USE_COLOR_ALPHA)
      vec4 vc = color;
    #elif defined(USE_COLOR)
      vec4 vc = vec4(color, 1.0);
    #else
      vec4 vc = vec4(1.0);
    #endif

    #ifdef STEM
      // stems carry their data in the vertex colour: sway, sun, sky, grow
      vec4 d = vc;
      float visible = step(d.a, uGrow);
      vec3 p = position;
    #else
      vec4 d = aData;
      // a leaf or flower opens as the stem reaches it
      float visible = smoothstep(d.a, d.a + 0.07, uGrow);
      vec3 p = position * visible;
    #endif

    vec4 wp = vec4(p, 1.0);
    vec3 n = normal;
    #ifdef USE_INSTANCING
      wp = instanceMatrix * wp;
      n = mat3(instanceMatrix) * n;
    #endif
    wp = modelMatrix * wp;
    n = normalize(mat3(modelMatrix) * n);

    // wind: a field smooth in space, so a whole raceme swings together
    float ph = wp.x * 0.9 + wp.y * 0.35;
    float sw = d.r;
    wp.x += sin(uTime * 1.1 + ph) * 0.035 * sw;
    wp.z += cos(uTime * 0.8 + ph * 1.3) * 0.025 * sw;
    wp.y += sin(uTime * 1.7 + ph * 2.0) * 0.006 * sw;

    vW = wp.xyz;
    vN = n;
    vUv = uv;
    #ifdef STEM
      vTint = vec3(1.0);
      vSeed = 0.0;
    #else
      vec3 inst = vec3(1.0);
      #ifdef USE_INSTANCING_COLOR
        inst = instanceColor;
      #endif
      // alpha is the tint mask: petals take the instance colour, a flower's
      // yellow heart keeps its own
      vTint = mix(vc.rgb, vc.rgb * inst, vc.a);
      vSeed = fract(dot(inst, vec3(13.1, 7.7, 3.3)));
    #endif
    vLight = vec3(d.g, d.b, visible);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const fragmentShader = glsl`
  uniform vec3 uSun;
  uniform vec3 uBark;
  uniform float uExposure;
  varying vec3 vN;
  varying vec3 vW;
  varying vec2 vUv;
  varying vec3 vTint;
  varying vec3 vLight;
  varying float vSeed;

  ${noise}

  void main() {
    if (vLight.z < 0.5) discard;

    #ifdef STEM
      vec3 base = uBark;
      // strokes run down the stem
      vec2 sp = vec2(vUv.x * 2.0, vUv.y * 0.35);
    #else
      vec3 base = vTint;
      // strokes run along each leaf and petal
      vec2 sp = vec2(vUv.x * 4.0 + vSeed * 9.0, vUv.y * 0.8);
    #endif

    vec3 N = normalize(vN);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(cameraPosition - vW);

    float stroke = fbm(sp * vec2(1.0, 5.0) + vW.xy * 0.6);
    float fine = vnoise(sp * vec2(3.0, 18.0));

    // an old palette: greens pulled toward olive and earth, each leaf mixed
    // a little differently on the palette knife
    // (foliage only: wisteria and laburnum keep their colour)
    float leafy = clamp((base.g - max(base.r, base.b)) * 8.0, 0.0, 1.0);
    float grey = dot(base, vec3(0.3, 0.55, 0.15));
    base = mix(base, mix(base, vec3(grey), 0.22) * vec3(1.0, 0.94, 0.74), leafy);
    base *= mix(vec3(0.82, 0.95, 0.78), vec3(1.12, 1.0, 0.8), vSeed);

    float ndl = max(dot(N, uSun), 0.0);
    float light = 0.12 + 0.22 * vLight.y + 0.75 * ndl * vLight.x;
    light += (stroke - 0.5) * 0.45 + (fine - 0.5) * 0.14;

    // blocked in as four values, the edges between them dragged by the brush
    float b1 = smoothstep(0.26, 0.32, light);
    float b2 = smoothstep(0.5, 0.56, light);
    float b3 = smoothstep(0.8, 0.86, light);
    vec3 umber = base * vec3(0.32, 0.27, 0.2) + vec3(0.012, 0.008, 0.004);
    vec3 half_ = base * vec3(0.66, 0.64, 0.58);
    vec3 hi = mix(base * 1.15, vec3(1.0, 0.93, 0.74), 0.3);
    vec3 col = mix(umber, half_, b1);
    col = mix(col, base, b2);
    col = mix(col, hi, b3);

    // the brush never lays one flat colour
    col *= mix(vec3(0.88, 0.98, 0.9), vec3(1.1, 0.98, 0.86), stroke);
    // bristle marks within a stroke
    col *= 0.9 + 0.2 * fine;

    #ifndef STEM
      // a darker stroke down the middle: a leaf's midrib, a petal's crease
      float rib = 1.0 - smoothstep(0.012, 0.05, abs(vUv.x - 0.5));
      col *= 1.0 - 0.22 * rib * step(0.06, vUv.y) * step(vUv.y, 0.94);
    #endif

    // contour: edges turning away from us go darker
    float rim = 1.0 - abs(dot(N, V));
    col = mix(col, umber * 0.8, 0.55 * smoothstep(0.5, 0.95, rim));

    // canvas under the paint
    vec2 g = gl_FragCoord.xy;
    float weave = sin(g.x * 1.15) * sin(g.y * 1.15);
    col *= 1.0 + 0.035 * weave + (hash(floor(g * 0.5)) - 0.5) * 0.035;

    // and old varnish over it
    col = mix(col, col * vec3(1.0, 0.88, 0.64), 0.45);

    gl_FragColor = vec4(col * uExposure, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** A grow uniform of its own, for a creeper that grows on its own clock —
 *  the rails' grow with the scroll, not with the time since load. */
export const railGrow = {
  left: { value: 0 },
  right: { value: 0 },
};

export function paintMaterial({
  stem,
  sun,
  exposure,
  grow = paintUniforms.uGrow,
}: {
  stem: boolean;
  sun: readonly [number, number, number];
  exposure: number;
  grow?: { value: number };
}) {
  return new ShaderMaterial({
    uniforms: {
      ...paintUniforms,
      uGrow: grow,
      uSun: { value: new Vector3(...sun).normalize() },
      uBark: { value: new Color("#4f3620") },
      uExposure: { value: exposure },
    },
    vertexShader,
    fragmentShader,
    defines: stem ? { STEM: "" } : {},
    vertexColors: true,
    side: DoubleSide,
  });
}
