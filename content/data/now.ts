/**
 * A /now page (nownownow.com/about) — what you're focused on at the moment.
 * Bump `updated` whenever you edit it; the page shows how stale it is.
 */

export const now = {
  updated: "2026-08-04",
  intro: "Currently building, reading, and looking for interesting problems.",
  sections: [
    {
      title: "Building",
      items: ["This site, in public.", "A 3D thing I'll write up when it works."],
    },
    {
      title: "Learning",
      items: ["Shader math beyond copy-paste.", "Rendering performance budgets."],
    },
    {
      title: "Open to",
      items: ["Frontend / full-stack roles.", "Freelance work involving graphics."],
    },
  ],
} as const;
