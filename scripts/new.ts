#!/usr/bin/env tsx
/**
 * Scaffold a new content file with valid frontmatter.
 *
 *   pnpm new project my-thing
 *   pnpm new post why-i-did-it
 *   pnpm new lab shader-toy
 *
 * Exists so that "add a project" never involves remembering which fields are
 * required — the generated frontmatter always satisfies the Zod schema in
 * src/lib/content/schema.ts.
 */

import fs from "node:fs";
import path from "node:path";

const TYPES = {
  project: "projects",
  post: "posts",
  lab: "lab",
} as const;

type Kind = keyof typeof TYPES;

const templates: Record<Kind, (title: string, date: string) => string> = {
  project: (title, date) => `---
title: ${title}
summary: One or two sentences. What it is and why it was worth building.
date: ${date}
tags: []
role: Solo · In progress
featured: false
draft: true
links: {}
---

## Problem

## Approach

## Outcome
`,

  post: (title, date) => `---
title: ${title}
summary: One or two sentences that make someone want to read the rest.
date: ${date}
tags: []
draft: true
---

Opening paragraph.

## First point
`,

  lab: (title, date) => `---
title: ${title}
summary: What you were poking at.
date: ${date}
tags: []
status: sketch
draft: true
---

What it is, in a couple of lines. Rough is fine.
`,
};

function toTitle(slug: string) {
  return slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function main() {
  const [kind, slug] = process.argv.slice(2);

  if (!kind || !slug || !(kind in TYPES)) {
    console.error(
      `Usage: pnpm new <${Object.keys(TYPES).join("|")}> <slug>\n` +
        `Example: pnpm new post how-i-shipped-it`,
    );
    process.exit(1);
  }

  const safeSlug = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!safeSlug) {
    console.error(`"${slug}" doesn't reduce to a usable slug.`);
    process.exit(1);
  }

  const dir = path.join(process.cwd(), "content", TYPES[kind as Kind]);
  const file = path.join(dir, `${safeSlug}.mdx`);

  if (fs.existsSync(file)) {
    console.error(`Already exists: ${path.relative(process.cwd(), file)}`);
    process.exit(1);
  }

  fs.mkdirSync(dir, { recursive: true });
  const date = new Date().toISOString().split("T")[0];
  fs.writeFileSync(file, templates[kind as Kind](toTitle(safeSlug), date));

  console.log(`Created ${path.relative(process.cwd(), file)}`);
  console.log(`It's marked draft: true — visible in dev, hidden in production.`);
}

main();
