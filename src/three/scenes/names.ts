/**
 * The list of scene names, in a server-safe module.
 *
 * This is separate from `registry.ts` (which is client-only, because it holds
 * dynamic component imports) so that server components — MDX frontmatter
 * validation, detail pages — can check a `scene:` value without pulling
 * three.js anywhere near the server bundle.
 *
 * Add a name here first; `registry.ts` is typed against this list, so TypeScript
 * will tell you the entry is missing.
 */
export const sceneNames = ["hero"] as const;

export type SceneName = (typeof sceneNames)[number];

export function isSceneName(value: string): value is SceneName {
  return (sceneNames as readonly string[]).includes(value);
}
