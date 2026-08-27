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

### Project-specific fields

Projects (not posts or lab notes) carry extra frontmatter beyond the shared
fields: `kind: "case-study" | "project"` picks the layout — `case-study` gets
the deep `CaseStudy` shell (facts rail, room for a header figure, numbered
sections in the body); `project` gets the lighter `EntryDetail` shell. Only
promote something to `case-study` when it has enough real material to earn
nine sections — a thin project padded into that shape reads worse than a
confident short one. `order` (ascending) curates Selected Work — the
flagship goes first, not just the newest. `stack` is a display-only tech
list (separate from `tags`, which drives filtering). `problem`/`approach`/
`outcome` are one-liners a work row renders directly, so the
challenge→solution→outcome structure is structural, not something prose has
to remember.

### What MDX can use

Only what's exported from [src/components/mdx/index.tsx](src/components/mdx/index.tsx):
`<Callout>`, `<Figure>`, `<Video>`, `<Scene>`, `<SystemFigure name="...">`
(a hand-drawn system diagram — see "Adding a system figure" below),
`<ResultsTable>`, `<Stat>`. Keep that map small and intentional — content
shouldn't reach into arbitrary app components.

Code fences support titles and line highlighting via rehype-pretty-code:

````
```ts title="src/lib/thing.ts" {2-4}
````

**`<ResultsTable rows={[...]}>` and `<Stat value={...}>` need a real JS
expression in their props — not just a string.** `next-mdx-remote` defaults
to stripping every `{}` expression from JSX attributes (`blockJS: true`),
a safeguard meant for MDX fetched from an untrusted remote source. This
site's content is all local and committed, so
[mdx-content.tsx](src/components/mdx/mdx-content.tsx) sets `blockJS: false`
— `blockDangerousJS` stays on, so `eval`/`Function`/`require`/`fs`/etc. are
still blocked, only plain data literals were ever affected. If a new MDX
component's props silently come back `undefined`, this is the first thing
to check.

---

## Adding a 3D scene

1. `src/three/scenes/<name>/index.tsx` — default-export a component containing
   **only** three.js elements, no DOM. Include its own
   `<PerspectiveCamera makeDefault>`; each view has its own camera.
2. `src/three/scenes/<name>/poster.tsx` — an **inline SVG component**, not a
   static asset. Read `--scene-color-hex` / `--scene-opacity` (or the
   scene's own tokens) via plain CSS `var()`, the same way `hero/poster.tsx`
   does. This is what ships to every visitor with 3D disabled and to the
   server on every request, so it repaints correctly on a theme toggle with
   zero JS — a static `<img src="...svg">` can't do that, because an
   internal `@media (prefers-color-scheme)` block desyncs from
   `next-themes`' class-based toggle the moment someone flips the switch
   manually against their OS setting. That mismatch is exactly the bug that
   shipped in the first version of this scene — don't reintroduce it.
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
  shared canvas, not by that element. Change intensity via `--scene-opacity`
  (or the equivalent uniform) instead.
- **A scene should never read `--accent-hex`.** That was the original bug in
  the hero scene: tinting a decorative field with the site's one accent
  color makes it compete with the actual accent uses (primary CTA, active
  nav) and reads as a generic colored-particle background rather than a
  deliberate signature. Give a scene its own `--scene-*` tokens instead — see
  the "one accent per viewport" rule below.
- **`AdditiveBlending` cannot darken or tint a near-white background** — it's
  not a tuning problem, it's the wrong blend equation. Branch on a
  `--scene-additive` token (or equivalent) so a scene uses
  `NormalBlending` in light mode and `AdditiveBlending` only where it can
  actually brighten something, the way `hero/index.tsx` does.
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

## Adding a system figure

Project pages use hand-drawn inline SVG diagrams instead of screenshots —
there's nothing to photograph in a backend API, and mocking up a fake UI
would be dishonest. See [src/components/figures/](src/components/figures)
for the pattern; `figure-frame.tsx` has the shared primitives
(`FigureFrame`, `FigureNode`, `FigureEdge`).

Rules that keep these from turning into clip art:

- **1px hairline strokes** in `var(--border-strong)`, mono ~11px labels in
  `var(--fg-subtle)` — always via `style={{ ... }}` referencing the CSS
  variable, never a hardcoded hex, so figures stay theme-aware for free.
- **No fills** except `var(--color-accent-subtle)`, no gradients, no drop
  shadows.
- **Exactly one accent element per figure**, marking the actually
  interesting part — the branch node, the blocked edge. If you're reaching
  for a second one, the figure is trying to say two things; split it.
- `role="img"` plus a real `<title>`/`<desc>` pair on `FigureFrame` — these
  are content, not decoration, and need to be readable by assistive tech.
- Register in [figures/index.tsx](src/components/figures/index.tsx)'s
  `figureRegistry`, then reference by that name from a project's `figure`
  frontmatter field (work-row thumbnail + case-study header) or inline via
  `<SystemFigure name="...">` in the MDX body.

## One accent per viewport

`--accent` marks the primary CTA, the active nav item, one figure element,
and the link-hover underline — and nothing else on screen at once. This is
what separates restraint from "SaaS product with a brand color." Before
adding a new accent use anywhere (a badge, a highlight, a scene tint), check
what's already claiming the accent in that view and use a hairline border,
a background-color delta, or plain `--fg`/`--fg-muted` weight instead.

## Content honesty

Every fact, number, and claim on this site — work history, project
descriptions, benchmark results — has to trace to something verified: either
a specific line of code in the linked repo, or something typed directly by
the site's owner in conversation. Two rules that came out of building the
current content pass, worth keeping permanently:

- **A number without its qualifier is worse than no number.** The
  macos-agent benchmark is only ever stated as "2 of 4 (n=4)," never a bare
  "50%" — `<Stat>`'s `note` prop is required, not optional, specifically so
  this can't be dropped by accident later.
- **Show the losing result next to the winning one.** `<ResultsTable>`
  exists because the honest version of the macos-agent eval has the agent
  _losing_ to GPT-4o on single-shot recall and _winning_ on multi-turn
  diagnosis — cutting the loss to make the page look better would be the
  first edit that makes every other number on the site less trustworthy.
- If you don't have a real number for something (usage stats, a metric, a
  team size), the sentence has to work without it. Don't round up "no data"
  to a plausible-sounding placeholder.

---

## Design and copy

- **All standing copy** — name, tagline, socials, navigation — is in
  [src/config/site.ts](src/config/site.ts). Never hardcode it in a component.
- **All design tokens** are in the `:root` / `.dark` blocks at the top of
  [src/app/globals.css](src/app/globals.css). Components use semantic tokens
  (`bg-bg-subtle`, `text-fg-muted`, `border-border`), never raw palette values.
  A redesign should mean editing that one block.
- `--accent-hex` / `--bg-hex` / `--scene-color-hex` are hex mirrors of their
  oklch counterparts, because three.js and inline SVG can't use `oklch()`
  the way three.js parses it. If you change a color in the palette, regenerate
  its hex mirror too — this cost real time to get right the first time; the
  oklch→sRGB→hex conversion script used to derive the current values is
  worth writing again rather than eyeballing a replacement.
- Two type families beyond sans/mono carry the entire visual identity:
  `--font-display` (Instrument Serif — headlines and section display lines
  only, never body copy) and `--font-mono` used harder than usual (eyebrows,
  dates, stack chips, metrics, table numerals). That editorial/engineering
  contrast is the whole "premium" read; don't dilute it by using the display
  face for UI chrome or the mono face for prose.
- **No shadows, anywhere.** Depth comes from a 1px `--border` hairline plus a
  `--bg` / `--bg-subtle` / `--bg-elevated` delta. Radii stay small
  (`--radius-sm/md/lg`, 2/4/6px) — large soft radii read consumer-app, small
  ones read instrument/editorial.
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
