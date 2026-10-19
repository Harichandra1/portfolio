/**
 * The receipts registry.
 *
 * Every factual claim on this site that a reader might reasonably want to
 * check has an entry here, and `<Claim id="...">` in the content renders the
 * marker that opens it.
 *
 * The rule this encodes: a claim is either checkable or labelled as not
 * checkable. There is no third category. `kind: "self-reported"` entries have
 * no `href` on purpose — those are claims from private work with no public
 * artifact, and hiding that fact among the linkable ones would defeat the
 * point of building this.
 *
 * Adding a claim: add it here, then wrap the text in `<Claim id="your-id">`.
 * scripts/honesty-check.ts fails the build if an id is referenced but missing,
 * or registered but never used.
 */

export type VerificationKind =
  /** Backed by source you can read. */
  | "code"
  /** Backed by a result file committed to the repo. */
  | "data"
  /** Backed by something running you can visit. */
  | "live"
  /** From private work. No public artifact — say so plainly. */
  | "self-reported";

export type Claim = {
  /** The assertion, restated plainly and narrowly. */
  assertion: string;
  /** What specifically backs it. */
  evidence: string;
  kind: VerificationKind;
  /** Where to check. Deliberately absent for self-reported claims. */
  href?: string;
  hrefLabel?: string;
  /** Limits on the claim. Shown as prominently as the claim itself. */
  caveat?: string;
};

const AGENT = "https://github.com/Harichandra1/macos-agent/blob/HEAD";
const AGENT_TREE = "https://github.com/Harichandra1/macos-agent/tree/HEAD";
const FINANCE =
  "https://github.com/Harichandra1/finance-dashboard-zorvyn/blob/HEAD/src/main/java/com/finance/finance_dashboard";
const WALLET =
  "https://github.com/Harichandra1/E-WALLET-MICROSERVICES_JBDL/blob/HEAD/E-WALLET%20MICROSERVICES_JBDL";
const UDP = "https://github.com/Harichandra1/Robust-Video-Transfer/blob/HEAD";

export const claims = {
  // ---------------------------------------------------------------- Metry AI
  "metry-latency": {
    assertion:
      "API response times dropped 33% after reworking indexing, caching, and query paths.",
    evidence:
      "Measured internally at Metry AI against a private codebase. There is no public artifact, and I can't link one.",
    kind: "self-reported",
    caveat:
      "Ask me what was measured, at which percentile, and over what window. I'd rather answer that than have you take the number on faith.",
  },
  "metry-founding": {
    assertion:
      "Joined as a backend engineer and moved onto the founding engineering team about three months in.",
    evidence: "Private employment history. Verifiable through a reference, not a link.",
    kind: "self-reported",
    caveat:
      "I don't have the exact promotion month on hand, so it's stated as “about three months.”",
  },
  "metry-sojo": {
    assertion:
      "SOJO is a client-management platform for beauty and wellness businesses across Asia.",
    evidence: "Metry AI's own public product site describes SOJO and who it's for.",
    kind: "live",
    href: "https://www.metryai.com/en",
    hrefLabel: "metryai.com",
  },

  // ----------------------------------------------------------- macos-agent
  "agent-graph": {
    assertion:
      "The agent is a branching LangGraph state machine, not a linear RAG chain.",
    evidence:
      "graph.py builds the intake → retrieve/search → merge → decide graph, where decide branches three ways: answer, clarify, or request a diagnostic.",
    kind: "code",
    href: `${AGENT}/Agent/backend/app/agent/graph.py`,
    hrefLabel: "Agent/backend/app/agent/graph.py",
  },
  "agent-scrapers": {
    assertion: "The knowledge base is built by 9 custom scrapers.",
    evidence:
      "Nine scraper modules: Apple Developer Forums, Ask Different, Stack Overflow, Reddit, WWDC, man pages, dev docs, GitHub, and a sitemap crawler.",
    kind: "code",
    href: `${AGENT_TREE}/vectorDBIngestion/scrapers`,
    hrefLabel: "vectorDBIngestion/scrapers/",
  },
  "agent-eval-gate": {
    assertion: "A failing eval score blocks the deploy rather than only warning.",
    evidence:
      "regression_gate.py compares a candidate's scores against a committed baseline.json and exits non-zero below it.",
    kind: "code",
    href: `${AGENT}/Agent/eval/regression_gate.py`,
    hrefLabel: "Agent/eval/regression_gate.py",
  },
  "agent-multiturn": {
    assertion:
      "On multi-turn cases the agent resolved 2 of 4 in an average of 2.25 turns; GPT-4o resolved 1 of 4 in 3.25.",
    evidence:
      "interactive_report.json, committed. Both judge models independently scored it 2 vs 1.",
    kind: "data",
    href: `${AGENT}/Agent/eval/results/interactive_report.json`,
    hrefLabel: "eval/results/interactive_report.json",
    caveat:
      "n=4. That is four cases. It is a signal about direction, not a measurement of general performance.",
  },
  "agent-singleshot": {
    assertion: "On single-shot questions the agent lost to GPT-4o in 5 of 6 cases.",
    evidence:
      "benchmark_report.json, committed. The second judge model scored it 0 wins of 3. Mean correctness: agent 1.67, GPT-4o 3.50.",
    kind: "data",
    href: `${AGENT}/Agent/eval/results/benchmark_report.json`,
    hrefLabel: "eval/results/benchmark_report.json",
    caveat:
      "This is the result that contradicts the flattering one. It's on the site for that reason.",
  },
  "agent-durable-memory": {
    assertion:
      "Multi-turn case state survives a restart or redeploy instead of living in process memory.",
    evidence:
      "LangGraph's Postgres checkpointer, with a test that exercises it against a real Postgres instance.",
    kind: "code",
    href: `${AGENT}/Agent/backend/tests/test_checkpointer_postgres.py`,
    hrefLabel: "tests/test_checkpointer_postgres.py",
  },
  "agent-failover": {
    assertion: "The agent fails over across Groq, NVIDIA, and OpenRouter.",
    evidence: "providers.py implements the cross-provider fallback chain and backoff.",
    kind: "code",
    href: `${AGENT}/Agent/backend/app/agent/providers.py`,
    hrefLabel: "app/agent/providers.py",
  },
  "agent-guardrails": {
    assertion: "PII redaction and prompt-abuse blocking run in front of the model.",
    evidence: "guardrails.py, with a dedicated test module.",
    kind: "code",
    href: `${AGENT}/Agent/backend/app/guardrails.py`,
    hrefLabel: "app/guardrails.py",
  },
  "agent-tests": {
    assertion:
      "Nine test modules cover auth, credits, guardrails, and the async Postgres checkpointer.",
    evidence: "Nine files under Agent/backend/tests/.",
    kind: "code",
    href: `${AGENT_TREE}/Agent/backend/tests`,
    hrefLabel: "Agent/backend/tests/",
  },
  "agent-live": {
    assertion: "The agent is deployed and reachable.",
    evidence: "Running on an Oracle Cloud VM behind Caddy TLS.",
    kind: "live",
    href: "https://macos-agent-hari.duckdns.org",
    hrefLabel: "macos-agent-hari.duckdns.org",
    caveat:
      "Sign-in is required and usage is capped by a per-user credit budget, so it's a demo rather than a service.",
  },
  "agent-no-usage": {
    assertion: "There are no usage numbers for this project.",
    evidence:
      "Nothing has been instrumented for real traffic because it hasn't had any. No sessions, users, or uptime figure is claimed anywhere on this site.",
    kind: "self-reported",
  },

  // ------------------------------------------------------- coding harness
  //
  // Every claim in this group is self-reported, and that is not an oversight:
  // the harness lives in a local repo that has not been pushed anywhere, so
  // the result files backing these numbers are on my machine. Rather than
  // leave the project off the site or dress the numbers up as checkable, the
  // claims say plainly that you cannot check them yet.
  "harness-swebench": {
    assertion:
      "A clean run of the harness resolved 38 of 50 SWE-bench Verified Mini instances, one attempt each.",
    evidence:
      "Graded by the official SWE-bench grader on the published evaluation images (run id full50-2026-10-18): 50 completed, 38 resolved, 0 errors, 0 empty patches. The report file is on my machine, not in a public repo.",
    kind: "self-reported",
    caveat:
      "The prompt includes the names of the failing tests and the test command, which agents on the public leaderboard are not given — so this number is not comparable with leaderboard results. The model is also pinned to temperature 1, so expect a point or two of run-to-run variance.",
  },
  "harness-first-pass": {
    assertion:
      "The first graded pass resolved 26 of 50, and 14 of those 24 failures were the grading environment rather than the agent.",
    evidence:
      "I read every report.json and test_output.txt against the gold patches. Twelve Sphinx 3.x instances died at pytest collection because docutils 0.22 dropped docutils.utils.roman, and two more broke on a Pygments whitespace-token change. Three of those patches were byte-identical to the gold patch.",
    kind: "self-reported",
    caveat:
      "This is my own account of debugging my own run. Ask me to walk through a specific instance.",
  },
  "harness-sandbox": {
    assertion:
      "Every command the agent runs executes in a per-run container with networking disabled and the workspace path-jailed.",
    evidence:
      "One container per agent run, built from the instance's own image, with the repository bind-mounted and docker exec per command. Stale containers are cleaned up on exit.",
    kind: "self-reported",
  },
  "harness-custom-eval": {
    assertion:
      "The 18-task custom eval is required to fail on the unmodified repository before it can score anything.",
    evidence:
      "A --validate mode runs the suite against the stock toy repo and refuses the suite if any task already passes, so it cannot be vacuously green. Two of the tasks are adversarial: the prompt names the wrong file.",
    kind: "self-reported",
  },
  "harness-judge": {
    assertion:
      "With three attempts per instance and a blind judge picking one, 7 of 12 hard instances resolved — and some candidate passed on 8.",
    evidence:
      "Three independent agents per instance, each in its own workspace; after each one the harness reverts the agent's test edits and re-runs the repo's test command, so the judge sees what newly fails rather than the agent's own summary. Every candidate is graded too, so the judge's picks can be scored against what was available.",
    kind: "self-reported",
    caveat:
      "Two judge revisions disagreed on the same inputs, so a single judge sample is noise — the final judge votes three times. Tuning a judge on graded candidates is tuning on the test set, which limits what that 7 means.",
  },
  "harness-never-solved": {
    assertion: "Four of the 50 instances were never solved in any configuration I ran.",
    evidence:
      "Four single runs and one best-of-three. In each of the four, the hidden test asserts something the issue text does not contain — exact Itanium-ABI manglings of C++ user-defined literals, SWIG-style signature continuations, index layout, and a feature the maintainers shipped on by default while the thread called it optional.",
    kind: "self-reported",
    caveat:
      "Named here because a harness that claims a path to 50 of 50 is claiming the issue text contains information it does not.",
  },

  // ------------------------------------------------------ finance-dashboard
  "finance-json-401": {
    assertion:
      "Spring Security's default HTML redirect is replaced with proper 401/403 JSON responses.",
    evidence:
      "RestAuthenticationEntryPoint and RestAccessDeniedHandler, wired in SecurityConfig.",
    kind: "code",
    href: `${FINANCE}/security/RestAuthenticationEntryPoint.java`,
    hrefLabel: "security/RestAuthenticationEntryPoint.java",
  },
  "finance-projections": {
    assertion: "Dashboard aggregation runs in SQL rather than in Java.",
    evidence:
      "Interface-based JPA projections — CategoryTotalProjection and MonthlyTrendProjection — so only the needed columns cross the wire.",
    kind: "code",
    href: `${FINANCE}/repository/projection/CategoryTotalProjection.java`,
    hrefLabel: "repository/projection/",
  },
  "finance-dto-split": {
    assertion:
      "Request and response DTOs are separate types, so a password hash has no field to serialize into.",
    evidence:
      "UserRequest, UserUpdateRequest, and UserResponse are three distinct classes.",
    kind: "code",
    href: `${FINANCE}/dto/user/UserResponse.java`,
    hrefLabel: "dto/user/UserResponse.java",
  },

  // ---------------------------------------------------------------- e-wallet
  "wallet-consumer-groups": {
    assertion:
      "Wallet-creation and transaction-update events are handled by two separate consumers with their own configs.",
    evidence:
      "WalletCreationConsumer and TxnUpdationConsumer, backed by KafkaConsumerConfig and KafkaConsumerConfig2.",
    kind: "code",
    href: `${WALLET}/Wallet-Service/src/main/java/org/gfg/WalletService/consumer/WalletCreationConsumer.java`,
    hrefLabel: "WalletService/consumer/",
  },
  "wallet-course": {
    assertion: "This was a course project, not production work.",
    evidence:
      "The package path is org.gfg, from a GeeksforGeeks-style curriculum. It's one squashed commit of roughly 1,500 lines, and it has never run in production.",
    kind: "code",
    href: "https://github.com/Harichandra1/E-WALLET-MICROSERVICES_JBDL",
    hrefLabel: "the repo",
  },
  "wallet-gaps": {
    assertion: "There is no idempotency key or dead-letter handling on the consumers.",
    evidence:
      "Nothing in the consumer code deduplicates a replayed event. A repeated transaction-update would double-credit.",
    kind: "code",
    href: `${WALLET}/Wallet-Service/src/main/java/org/gfg/WalletService/consumer/TxnUpdationConsumer.java`,
    hrefLabel: "TxnUpdationConsumer.java",
    caveat: "Named here rather than left for a reviewer to find.",
  },

  // ------------------------------------------------------------------- UDP
  "udp-loc": {
    assertion: "The whole reliability layer is 416 lines of C across two files.",
    evidence:
      "Client.c and Server.c — sequence numbers, ACKs, gap detection, retransmission.",
    kind: "code",
    href: `${UDP}/Server.c`,
    hrefLabel: "Server.c",
    caveat:
      "A learning exercise. There are no throughput numbers because I never measured any.",
  },
} as const satisfies Record<string, Claim>;

export type ClaimId = keyof typeof claims;

export function isClaimId(value: string): value is ClaimId {
  return Object.hasOwn(claims, value);
}

/** Tally by kind, for the receipts note. Computed, never hand-written. */
export function claimTally() {
  const all = Object.values(claims) as Claim[];
  return {
    total: all.length,
    checkable: all.filter((c) => c.kind !== "self-reported").length,
    selfReported: all.filter((c) => c.kind === "self-reported").length,
  };
}
