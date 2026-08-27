import { Fragment } from "react";
import { Claim } from "./claim";

/**
 * Renders a plain string that may carry inline claim markers.
 *
 * Typed data files (content/data/*.ts) can't hold JSX, so a claim inside one
 * is written as `{{claim-id|the visible text}}` and expanded here. MDX uses
 * `<Claim id="...">` directly and never needs this.
 *
 * scripts/honesty-check.ts understands both spellings.
 */
const MARKER = /\{\{([a-z0-9-]+)\|([^}]+)\}\}/g;

export function ClaimText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(MARKER)) {
    const [full, id, label] = match;
    const at = match.index;

    if (at > cursor) parts.push(text.slice(cursor, at));
    parts.push(
      <Claim key={`${id}-${at}`} id={id}>
        {label}
      </Claim>,
    );
    cursor = at + full.length;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>{part}</Fragment>
      ))}
    </>
  );
}
