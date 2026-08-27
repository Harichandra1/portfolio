#!/usr/bin/env tsx
/**
 * The site's own regression gate.
 *
 * The macOS agent has regression_gate.py, which blocks a deploy when the eval
 * score drops below a committed baseline. This is the same idea pointed at the
 * content: it fails the build when the writing drifts toward claims that can't
 * be backed up.
 *
 * It is deliberately mechanical and a little blunt. A check that only passes
 * when someone remembers to be careful isn't a check.
 *
 *   pnpm honesty
 */

import fs from "node:fs";
import path from "node:path";
import { claims } from "../content/data/claims";

type Violation = { file: string; line: number; rule: string; detail: string };

const ROOT = process.cwd();
const violations: Violation[] = [];

/** Every .mdx file plus the typed content data files. */
function contentFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(mdx|ts)$/.test(entry.name) && entry.name !== "claims.ts")
        out.push(full);
    }
  };
  walk(path.join(ROOT, "content"));
  return out;
}

const rel = (f: string) => path.relative(ROOT, f);

/**
 * RULE 1 — no unbacked superlatives or growth-copy verbs.
 *
 * These are the words that turn a description into a pitch. If one is truly
 * warranted it belongs in a claim with a receipt, not loose in prose.
 */
const BANNED = [
  "outperform",
  "beats gpt",
  "better than gpt",
  "state of the art",
  "state-of-the-art",
  "world-class",
  "world class",
  "cutting-edge",
  "blazing",
  "seamless",
  "revolutionary",
  "game-chang",
  "10x",
  "best-in-class",
];

/**
 * RULE 2 — a benchmark number needs its sample size in the same paragraph.
 *
 * "50% resolution" without "n=4" beside it is the exact shape of claim this
 * whole system exists to prevent.
 */
const BENCHMARK_HINT = /\b(resolution|resolved|win|won|loss|lost|beat)\b/i;
const SAMPLE_HINT = /\b(n\s*=\s*\d+|\d+\s*(?:of|\/)\s*\d+|four cases|small sample)\b/i;

/** RULE 3 — a bare percentage must be attached to a registered claim. */
const PERCENT = /\b\d{1,3}%/;

/**
 * Claims are spelled `<Claim id="x">` in MDX and `{{x|text}}` in the typed
 * data files, which can't hold JSX. Both count.
 */
const CLAIM_JSX = /<Claim\s+id="([^"]+)"/g;
const CLAIM_MARKER = /\{\{([a-z0-9-]+)\|/g;
const HAS_CLAIM = /<Claim\s|\{\{[a-z0-9-]+\|/;

/** The components that implement claims, and so quote the syntax in docs. */
const MACHINERY = new Set(["claim.tsx", "claim-text.tsx"]);

function checkProse(file: string, text: string) {
  const paragraphs = text.split(/\n\s*\n/);
  let lineCursor = 1;

  for (const para of paragraphs) {
    const lineNo = lineCursor;
    lineCursor += para.split("\n").length + 1;

    const lower = para.toLowerCase();
    // Skip fenced code and this file's own rule definitions.
    if (para.trimStart().startsWith("```")) continue;

    for (const word of BANNED) {
      if (lower.includes(word)) {
        violations.push({
          file: rel(file),
          line: lineNo,
          rule: "banned-superlative",
          detail: `"${word}" — replace it with something checkable, or attach a receipt.`,
        });
      }
    }

    if (BENCHMARK_HINT.test(para) && PERCENT.test(para) && !SAMPLE_HINT.test(para)) {
      violations.push({
        file: rel(file),
        line: lineNo,
        rule: "benchmark-without-n",
        detail: "A benchmark percentage here has no sample size beside it.",
      });
    }

    if (PERCENT.test(para) && !HAS_CLAIM.test(para)) {
      violations.push({
        file: rel(file),
        line: lineNo,
        rule: "percentage-without-receipt",
        detail:
          "A percentage appears outside a <Claim>. Wrap it so a reader can see what backs it.",
      });
    }
  }
}

/** RULE 4 — the registry and the content agree with each other. */
function checkRegistry(files: string[]) {
  const used = new Set<string>();

  const collect = (text: string) => {
    for (const m of text.matchAll(new RegExp(CLAIM_JSX))) used.add(m[1]);
    for (const m of text.matchAll(new RegExp(CLAIM_MARKER))) used.add(m[1]);
  };

  for (const file of files) collect(fs.readFileSync(file, "utf8"));

  // Claims can also be used from .tsx components.
  const walkSrc = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkSrc(full);
      // claim.tsx / claim-text.tsx document the syntax in their comments;
      // those examples are documentation, not usage.
      else if (entry.name.endsWith(".tsx") && !MACHINERY.has(entry.name)) {
        collect(fs.readFileSync(full, "utf8"));
      }
    }
  };
  walkSrc(path.join(ROOT, "src"));

  const registered = new Set(Object.keys(claims));

  for (const id of used) {
    if (!registered.has(id)) {
      violations.push({
        file: "content/data/claims.ts",
        line: 0,
        rule: "unregistered-claim",
        detail: `<Claim id="${id}"> is used but not registered.`,
      });
    }
  }
  for (const id of registered) {
    if (!used.has(id)) {
      violations.push({
        file: "content/data/claims.ts",
        line: 0,
        rule: "orphan-claim",
        detail: `"${id}" is registered but never used. Remove it or use it.`,
      });
    }
  }

  // RULE 5 — a self-reported claim must not carry a link, and a checkable
  // one must. The distinction is the whole point of the registry.
  for (const [id, claim] of Object.entries(claims)) {
    if (claim.kind === "self-reported" && "href" in claim && claim.href) {
      violations.push({
        file: "content/data/claims.ts",
        line: 0,
        rule: "self-reported-with-link",
        detail: `"${id}" is self-reported but has an href. Pick one.`,
      });
    }
    if (claim.kind !== "self-reported" && !("href" in claim && claim.href)) {
      violations.push({
        file: "content/data/claims.ts",
        line: 0,
        rule: "checkable-without-link",
        detail: `"${id}" claims to be checkable but links nowhere.`,
      });
    }
  }
}

function main() {
  const files = contentFiles();
  for (const file of files) checkProse(file, fs.readFileSync(file, "utf8"));
  checkRegistry(files);

  const total = Object.keys(claims).length;
  const selfReported = Object.values(claims).filter(
    (c) => c.kind === "self-reported",
  ).length;

  if (violations.length === 0) {
    console.log(
      `honesty-check: pass — ${files.length} files, ${total} claims ` +
        `(${total - selfReported} checkable, ${selfReported} self-reported)`,
    );
    return;
  }

  console.error(`\nhonesty-check: ${violations.length} violation(s)\n`);
  for (const v of violations) {
    const where = v.line ? `${v.file}:${v.line}` : v.file;
    console.error(`  ${where}\n    [${v.rule}] ${v.detail}\n`);
  }
  console.error("Rules live in scripts/honesty-check.ts. Fix the copy, not the rule.\n");
  process.exit(1);
}

main();
