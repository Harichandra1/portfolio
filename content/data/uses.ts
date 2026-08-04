/** Gear and tooling, grouped. Rendered at /uses. */

export type UsesGroup = {
  title: string;
  items: { name: string; note?: string; url?: string }[];
};

export const uses: UsesGroup[] = [
  {
    title: "Editor & terminal",
    items: [
      { name: "VS Code", note: "with Vim keybindings" },
      { name: "Ghostty", note: "zsh + starship" },
      { name: "Claude Code", note: "for the tedious parts" },
    ],
  },
  {
    title: "Hardware",
    items: [{ name: "MacBook Pro", note: "M-series, 16GB" }],
  },
  {
    title: "Building with",
    items: [
      { name: "TypeScript" },
      { name: "Next.js", url: "https://nextjs.org" },
      { name: "three.js / R3F", url: "https://r3f.docs.pmnd.rs" },
      { name: "Tailwind CSS", url: "https://tailwindcss.com" },
    ],
  },
];
