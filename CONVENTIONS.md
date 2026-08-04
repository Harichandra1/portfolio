# Conventions

How to change things here without having to rediscover the architecture.
Read this first when you come back to the project after a break.

## The one rule

**Adding something is one file.** If adding a project, post, or experiment ever
requires editing more than one file, something has drifted — fix the plumbing
rather than working around it.

---

## Adding content

```bash
pnpm new project my-thing
pnpm new post why-i-did-it
pnpm new lab shader-toy
```

That writes `content/<type>/<slug>.mdx` with valid frontmatter and
`draft: true`. Edit it, flip `draft` to `false`, commit. The listing page,
detail route, tag filter, sitemap, and RSS feed all pick it up automatically.

- **Drafts** render in `pnpm dev` and are excluded from production builds.
- **Frontmatter is validated at build time** by Zod
  ([src/lib/content/schema.ts](src/lib/content/schema.ts)). A missing or
  mistyped field fails `pnpm build` with the file name and the offending field.
  That's intentional — a red build beats a broken production page.
- **Adding a frontmatter field**: add it to the schema. It's typed everywhere
  immediately; TypeScript shows you what needs updating.

### What MDX can use

Only what's exported from [src/components/mdx/index.tsx](src/components/mdx/index.tsx):
`<Callout>`, `<Figure>`, `<Video>`, `<Scene>`. Keep that map small and
intentional — content shouldn't reach into arbitrary app components.

Code fences support titles and line highlighting via rehype-pretty-code:

````
```ts title="src/lib/thing.ts" {2-4}
````

---

## Adding a 3D scene

1. `src/three/scenes/<name>/index.tsx` — default-export a component containing
   **only** three.js elements, no DOM. Include its own
   `<PerspectiveCamera makeDefault>`; each view has its own camera.
2. `public/posters/<name>.svg` — a static still. This is what visitors with 3D
   disabled actually see, so make it look deliberate.
3. Add the name to [src/three/scenes/names.ts](src/three/scenes/names.ts), then
   an entry in [registry.ts](src/three/scenes/registry.ts). TypeScript enforces
   that every name has an entry.

Render it anywhere with `<SceneView name="<name>" />`, from MDX with
`<Scene name="<name>" />`, or set `scene: <name>` in frontmatter to get a
banner on that content's detail page.

### Things that will bite you

- **There is exactly one `<Canvas>`** for the whole app, in
  [canvas-provider.tsx](src/three/canvas/canvas-provider.tsx). Never add
  another — scenes claim a rectangle of the shared one via drei's `View`.
- **Both halves of drei's `View` must come from
  [view-bridge.tsx](src/three/canvas/view-bridge.tsx).** They're connected by a
  module-level tunnel; two module instances means nothing renders, silently and
  with no error. This is also why `@react-three/drei` is deliberately excluded
  from `optimizePackageImports` in `next.config.ts`.
- **CSS `opacity` on a wrapper does not dim a scene.** The 3D is painted on the
  shared canvas, not by that element. Change intensity in the shader.
- **Shaders live in `.ts` files** as `glsl`-tagged template strings, not
  `.glsl` files — no bundler loader to configure. Install a "glsl-literal"
  editor extension for highlighting.
- **Models**: compress first, then load through
  [loaders.ts](src/three/loaders.ts), which has DRACO/meshopt/KTX2 already
  wired up.
  ```bash
  npx gltf-transform optimize in.glb public/models/out.glb
  npx gltfjsx public/models/out.glb -o src/three/components/Out.tsx -t
  ```

### The guarantees

Every scene degrades to its poster when: `prefers-reduced-motion` is set, there
is no WebGL2, `deviceMemory < 4`, save-data is on, or the scene throws at
runtime. The server always renders the poster — check with
`curl localhost:3000 | grep canvas` (should be zero). Keep it that way.

---

## Design and copy

- **All standing copy** — name, tagline, socials, navigation — is in
  [src/config/site.ts](src/config/site.ts). Never hardcode it in a component.
- **All design tokens** are in the `:root` / `.dark` blocks at the top of
  [src/app/globals.css](src/app/globals.css). Components use semantic tokens
  (`bg-bg-subtle`, `text-fg-muted`, `border-border`), never raw palette values.
  A redesign should mean editing that one block.
- `--accent-hex` / `--bg-hex` are hex mirrors of the accent and background,
  because three.js cannot parse `oklch()`. Keep them in step.
- Adding a nav item: add it to `siteConfig.nav`. Header and footer both read it.

---

## Workflow

`main` is production. Feature branch → PR → Vercel gives you a preview URL →
merge. Content-only commits can go straight to `main`.

```bash
pnpm dev        # dev server
pnpm check      # typecheck + lint + build — what CI runs
pnpm format     # prettier
```

CI runs on every PR and blocks merge on failure.

### Environment

Copy `.env.example` to `.env.local`. Nothing is required locally.
In Vercel, set `NEXT_PUBLIC_SITE_URL` to your production domain — without it,
`robots.txt` disallows everything, which is the intended default so preview
deployments never get indexed.
