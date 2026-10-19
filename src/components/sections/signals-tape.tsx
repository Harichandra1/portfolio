import { claimTally } from "@content/data/claims";

/**
 * A thin tape of facts under the hero.
 *
 * The brief for this was "the top of the page is dull," and the restraint
 * elsewhere on the site is what made it dull — so this adds movement without
 * adding colour or elevation: mono, uppercase, hairline-bordered, edge-masked,
 * and slow enough to read. It reads as a ticker tape on an instrument rather
 * than a marketing banner, which is the line this site walks everywhere else.
 *
 * Every item here is a fact stated elsewhere on the site with a receipt
 * attached, and the claim count is computed from the registry rather than
 * typed — a hand-written number about how carefully this site is sourced
 * would be a poor advertisement for the idea.
 *
 * Two identical copies of the list sit in one track; see `.tape` in
 * globals.css for why, and for how this behaves under reduced motion. The
 * duplicate is aria-hidden so a screen reader hears the list once.
 */
export function SignalsTape() {
  const { total } = claimTally();

  const items = [
    "Founding engineer · Metry AI",
    "Agentic RAG in production",
    "38 of 50 on SWE-bench Verified Mini",
    "9 ingestion pipelines, one knowledge base",
    "Judge panel + a gate that blocks its own deploy",
    "FastAPI · Spring Boot · LangGraph",
    `${total} claims on this site, each with a receipt`,
    "Hyderabad · IST (UTC+5:30)",
  ];

  const track = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item} className="flex items-center whitespace-nowrap">
          <span className="text-fg-muted text-2xs font-mono tracking-wide uppercase">
            {item}
          </span>
          <span
            aria-hidden
            className="bg-border-strong mx-6 size-[3px] shrink-0 rounded-full"
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className="border-border overflow-hidden border-y py-3"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 6rem, black calc(100% - 6rem), transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 6rem, black calc(100% - 6rem), transparent)",
      }}
    >
      <div className="tape flex w-max">
        {track(false)}
        {track(true)}
      </div>
    </div>
  );
}
