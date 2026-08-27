import { glsl } from "@/three/shaders/glsl";

export const vertexShader = glsl`
  uniform float uTime;
  uniform float uSize;

  attribute float aScale;

  varying float vAlpha;

  void main() {
    vec3 p = position;

    // Two out-of-phase waves so the lattice never visibly loops.
    float wave =
      sin(p.x * 0.55 + uTime * 0.62) *
      cos(p.z * 0.48 + uTime * 0.41);

    p.y += wave * 0.75;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    // Perspective-correct sizing: points shrink with distance.
    gl_PointSize = uSize * aScale * (1.0 / max(-mv.z, 0.001));

    // Crests are bright, troughs fade out.
    vAlpha = smoothstep(-1.0, 1.0, wave) * 0.85 + 0.15;
  }
`;

export const fragmentShader = glsl`
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vAlpha;

  void main() {
    // Turn the square point sprite into a soft disc.
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.12, d) * vAlpha * uOpacity;

    // Placed after every multiply so a low uOpacity (light theme, normal
    // blending) discards more fragments rather than fewer — cheaper, not
    // just dimmer.
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(uColor, alpha);
  }
`;
