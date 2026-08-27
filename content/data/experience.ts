/**
 * Work history, newest first. Rendered as the timeline on /about.
 * Set `end: null` for a role you're currently in.
 *
 * Every fact here traces to /Users/hari/Resume/0-master/MASTER.md (a
 * code-level audit of the underlying repos) plus a web search confirming
 * what Metry AI actually builds. Do not add a number or claim that isn't in
 * that source without asking first — see CONVENTIONS.md.
 */

export type Role = {
  company: string;
  title: string;
  start: string; // "2024-06"
  end: string | null;
  location?: string;
  url?: string;
  /** A fact that doesn't fit a single dated row — e.g. a promotion with no
   *  exact month. Prevents inventing a second dated entry to carry it. */
  note?: string;
  /** Two or three bullets. Lead with impact, not responsibilities. */
  highlights: string[];
  stack?: string[];
};

export const experience: Role[] = [
  {
    company: "Metry AI",
    title: "Founding Engineer",
    start: "2026-03",
    end: null,
    location: "Remote — async with a Canada-based team",
    url: "https://www.metryai.com/en",
    note: "{{metry-founding|Joined as a Backend Engineer; moved onto the founding engineering team about three months in.}}",
    highlights: [
      "Own backend architecture and REST API development for SOJO — {{metry-sojo|Metry AI's client-management platform for beauty and wellness businesses across Asia}} — carrying microservices and data models from design through production support.",
      "Cut {{metry-latency|API response times 33%}} by reworking database indexing, caching, and query paths to eliminate redundant PostgreSQL reads.",
      "Integrated LLM APIs and rebuilt prompt workflows behind structured testing and evaluation, raising response quality and consistency across platform features.",
      "Instrumented API performance, service health, and production failures in Grafana, shortening the path from a failure firing to a diagnosed root cause.",
      "Work largely async with a team about ten hours away, across architecture, CI/CD, and reliability decisions.",
    ],
    stack: [
      "Python",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "REST APIs",
      "Microservices",
      "Docker",
      "GitHub Actions",
      "Grafana",
    ],
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
    school: "Manipal Institute of Technology",
    credential: "B.Tech, Computer Science",
    start: "2021-08",
    end: "2025-05",
    note: "Karnataka, India",
  },
];

export type Certification = {
  name: string;
  issuer: string;
  status: "verified" | "in-progress";
  url?: string;
};

export const certifications: Certification[] = [
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    status: "verified",
    url: "https://www.credly.com/badges/1980ca54-806a-4e70-9425-dae3ba430eb0/public_url",
  },
  {
    name: "Google Cybersecurity Professional Certificate",
    issuer: "Google · Coursera",
    status: "verified",
    url: "https://coursera.org/verify/professional-cert/MXHDGZGDAHB6",
  },
  {
    name: "PG Certification in AI/ML",
    issuer: "IIIT Hyderabad",
    status: "in-progress",
  },
];
