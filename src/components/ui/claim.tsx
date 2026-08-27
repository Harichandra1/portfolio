"use client";

import { useEffect, useId, useRef, useState } from "react";
import { claims, isClaimId, type Claim as ClaimData } from "@content/data/claims";
import { cn } from "@/lib/utils";

const kindLabel: Record<ClaimData["kind"], string> = {
  code: "Source",
  data: "Committed data",
  live: "Live",
  "self-reported": "Self-reported",
};

/**
 * An inline claim with a receipt attached.
 *
 * `self-reported` renders in a deliberately different, un-accented style: it
 * is the one kind a reader cannot check, and it should look different from
 * the ones they can. Making those visually identical would be the dishonest
 * version of this component.
 */
export function Claim({ id, children }: { id: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  // An unregistered id renders as plain text rather than throwing — but
  // scripts/honesty-check.ts fails the build on it, so this never ships.
  if (!isClaimId(id)) return <>{children}</>;
  const claim: ClaimData = claims[id];
  const unverifiable = claim.kind === "self-reported";

  return (
    <span ref={wrapRef} className="relative inline">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "decoration-dotted underline-offset-4 transition-colors",
          "cursor-pointer text-left underline",
          unverifiable
            ? "decoration-fg-subtle hover:decoration-fg-muted"
            : "decoration-accent/60 hover:decoration-accent",
        )}
      >
        {children}
        <span
          aria-hidden
          className={cn(
            "ml-0.5 align-super font-mono text-[0.6em] leading-none",
            unverifiable ? "text-fg-subtle" : "text-accent",
          )}
        >
          {unverifiable ? "—" : "✓"}
        </span>
        <span className="sr-only">
          {" "}
          — {unverifiable ? "self-reported claim" : "verifiable claim"}, show the receipt
        </span>
      </button>

      {open ? (
        <span
          id={panelId}
          role="group"
          aria-label="Receipt"
          className={cn(
            "border-border bg-bg-elevated absolute top-[calc(100%+0.5rem)] left-0 z-50 block rounded-(--radius-lg)",
            "w-[min(22rem,calc(100vw-2.5rem))] border p-4 text-left",
          )}
        >
          <span
            className={cn(
              "text-2xs block font-mono tracking-wide uppercase",
              unverifiable ? "text-fg-subtle" : "text-accent",
            )}
          >
            {kindLabel[claim.kind]}
          </span>

          <span className="text-fg mt-2 block text-sm font-medium">
            {claim.assertion}
          </span>
          <span className="text-fg-muted mt-2 block text-sm">{claim.evidence}</span>

          {claim.caveat ? (
            <span className="border-border text-fg-subtle mt-3 block border-t pt-3 text-sm">
              {claim.caveat}
            </span>
          ) : null}

          {claim.href ? (
            <a
              href={claim.href}
              target="_blank"
              rel="noreferrer"
              className="decoration-border-strong hover:decoration-accent text-fg text-2xs mt-3 inline-block font-mono tracking-wide underline underline-offset-4"
            >
              {claim.hrefLabel ?? "Check it"} &rarr;
            </a>
          ) : (
            <span className="text-fg-subtle text-2xs mt-3 block font-mono tracking-wide uppercase">
              Nothing to link
            </span>
          )}
        </span>
      ) : null}
    </span>
  );
}
