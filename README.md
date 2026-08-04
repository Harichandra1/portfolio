# Portfolio

Personal site: projects, writing, experiments, and 3D.

Built to be edited constantly — adding a project, a post, or an experiment is
one MDX file and one commit. See [CONVENTIONS.md](CONVENTIONS.md) for how to
work on it.

## Stack

|           |                                           |
| --------- | ----------------------------------------- |
| Framework | Next.js 16 (App Router, RSC) + TypeScript |
| Styling   | Tailwind v4, CSS-first tokens             |
| Content   | MDX + Zod-validated frontmatter           |
| 3D        | three.js + React Three Fiber + drei       |
| Deploy    | Vercel                                    |

## Getting started

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

```bash
pnpm new post my-first-post   # scaffold content
pnpm check                    # typecheck + lint + build (what CI runs)
```

## Layout

```
content/          MDX + typed data. All content lives here, outside src/.
  projects/       *.mdx
  posts/          *.mdx  → /blog
  lab/            *.mdx
  data/           experience, uses, now
public/           models, textures, posters, images
src/
  app/            routes, sitemap, robots, RSS, OG image
  components/     ui/ primitives · layout/ chrome · sections/ blocks · mdx/ content API
  three/          the entire 3D layer, isolated behind <SceneView>
  lib/            content pipeline, SEO, utils
  config/site.ts  every piece of standing copy
```

Three boundaries keep iteration cheap:

1. `content/` never imports from `src/` — content is data.
2. `src/three/` is only ever reached through `<SceneView>` — the 3D layer can be
   rewritten without touching a single page.
3. `src/config/site.ts` and the token block in `src/app/globals.css` are the
   only homes for copy and design decisions.

## 3D

One shared WebGL canvas for the whole app; scenes claim a rectangle of it. The
canvas is lazy-loaded, and never mounts at all on routes with no scene.

Every scene has a static poster that is what actually ships when
`prefers-reduced-motion` is set, WebGL2 is missing, the device is low-memory or
on save-data, or the scene throws. Server-rendered HTML always contains the
poster and never a `<canvas>`.

## Deploying

Push to GitHub, import the repo at [vercel.com/new](https://vercel.com/new).
Zero config — every PR gets a preview URL, `main` is production.

Set `NEXT_PUBLIC_SITE_URL` to the production domain in Vercel's environment
variables. Until it's set, `robots.txt` disallows crawling, which is deliberate:
preview deployments should never be indexed.

## Still to do

- Replace the seed content in `content/projects/` and `content/posts/`.
- Fill in `content/data/experience.ts`, `uses.ts`, and `now.ts`.
- Add `public/resume.pdf` and set `resumePath` in `src/config/site.ts` to show
  the resume button on /about.
- Point the social links in `src/config/site.ts` at real accounts.
