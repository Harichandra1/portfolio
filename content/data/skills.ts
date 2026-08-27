/**
 * Grouped skills for the /  and /about skills section. Every item here is
 * evidenced by a specific repo in the source-material audit — this is not a
 * keyword wall, so resist the urge to pad it. If you can't point to which
 * project proves an item, it doesn't belong here.
 */

export type SkillGroup = {
  title: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    title: "Languages",
    items: ["Python", "Java", "TypeScript", "JavaScript", "C", "SQL"],
  },
  {
    title: "LLM & agents",
    items: [
      "LangGraph",
      "Agentic RAG",
      "Tool calling",
      "LLM-as-judge evaluation",
      "Guardrails / PII redaction",
      "Provider failover",
      "Embeddings & vector search",
    ],
  },
  {
    title: "Backend",
    items: [
      "FastAPI",
      "Spring Boot",
      "Spring Security",
      "Spring Data JPA",
      "REST API design",
      "Microservices",
      "Kafka",
      "Event-driven architecture",
      "JWT / OAuth",
    ],
  },
  {
    title: "Data",
    items: ["PostgreSQL", "MySQL", "Qdrant", "SQLAlchemy", "Alembic", "JPA projections"],
  },
  {
    title: "Infra & ops",
    items: [
      "Docker",
      "GitHub Actions / CI",
      "Prometheus",
      "Grafana",
      "Loki",
      "Oracle Cloud",
    ],
  },
  {
    title: "Frontend",
    items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "MDX", "React Three Fiber"],
  },
  {
    title: "Systems",
    items: ["POSIX threads", "UDP socket & protocol design"],
  },
];
