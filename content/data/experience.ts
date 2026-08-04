/**
 * Work history, newest first. Rendered as the timeline on /about.
 * Set `end: null` for a role you're currently in.
 */

export type Role = {
  company: string;
  title: string;
  start: string; // "2024-06"
  end: string | null;
  location?: string;
  url?: string;
  /** Two or three bullets. Lead with impact, not responsibilities. */
  highlights: string[];
  stack?: string[];
};

export const experience: Role[] = [
  {
    company: "Your Company",
    title: "Software Engineer",
    start: "2025-01",
    end: null,
    location: "Remote",
    url: "https://example.com",
    highlights: [
      "Replace this entry with a real role — the shape is what matters.",
      "Lead each bullet with the outcome, then the mechanism.",
    ],
    stack: ["TypeScript", "React", "PostgreSQL"],
  },
  {
    company: "Earlier Company",
    title: "Engineering Intern",
    start: "2024-05",
    end: "2024-08",
    location: "Hyderabad, IN",
    highlights: ["Shipped something you're willing to be asked about in an interview."],
    stack: ["Python", "FastAPI"],
  },
];

export type Education = {
  school: string;
  credential: string;
  start: string;
  end: string | null;
  note?: string;
};

export const education: Education[] = [
  {
    school: "Your University",
    credential: "B.Tech, Computer Science",
    start: "2021-08",
    end: "2025-05",
  },
];
