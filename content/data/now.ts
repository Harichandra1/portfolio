/**
 * A /now page (nownownow.com/about) — what's currently in progress.
 * Bump `updated` whenever you edit it; the page shows how stale it is.
 * No availability claim here on purpose — see CONVENTIONS.md.
 */

export const now = {
  updated: "2026-08-27",
  intro: "What I'm actually working on right now.",
  sections: [
    {
      title: "Building",
      items: [
        "SOJO's backend at Metry AI — API design, data models, and reliability work.",
        "The macOS troubleshooting agent's evaluation harness — the multi-turn / single-shot split is the current interesting problem.",
      ],
    },
    {
      title: "Learning",
      items: ["PG Certification in AI/ML, IIIT Hyderabad — in progress."],
    },
  ],
} as const;
