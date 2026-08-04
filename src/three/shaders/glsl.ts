/**
 * Identity tag for GLSL written inline in TypeScript.
 *
 * Shaders live in `.ts` files rather than `.glsl` on purpose: no bundler loader
 * to configure, no build config to drift, and uniforms stay next to the code
 * that sets them. Editor extensions that highlight `glsl`-tagged templates
 * (e.g. "glsl-literal") light these up.
 */
export const glsl = (strings: TemplateStringsArray, ...values: unknown[]) =>
  String.raw({ raw: strings }, ...values);
