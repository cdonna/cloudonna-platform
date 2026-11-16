# Agent Runtime

**Status:** Design only. Nothing in this document is implemented. Per the
brief, this sprint designs exactly three things — the Donna Orchestrator
interface, the Evidence Agent interface, and the `AgentRun` record — and
deliberately does not build the agent swarm.

The interfaces below are written as TypeScript because a type signature is
the most reviewable form of an interface design. They are **not** committed
as a source module: an unused types file would be dead code carried by
`tsc`, `eslint` and every future refactor for no current caller. They move
into `apps/web/src/components/donna-ai/agents/` when the first agent is
actually built.

---

## 1. The boundary that already exists

ClouDonna's provider boundary (`docs/intelligence/provider-boundaries.md`) is
the precedent, and the agent runtime is an extension of it rather than a new
idea:

- the deterministic engine computes
- the provider sees only a validated `EvidencePackage`
- the provider's output is Zod-validated before it is allowed anywhere
- a deterministic fallback exists when no provider is configured

Agents inherit all four. **No agent scores anything.** An agent gathers,
structures, challenges and explains; the deterministic engine decides.

## 2. Donna Orchestrator

```ts
export interface DonnaOrchestrator {
  /** Decompose an objective into a plan. Pure and inspectable: the plan is
   *  returned for review before anything runs, so a human can see what was
   *  about to happen. */
  plan(objective: AgentObjective): Promise<AgentPlan>;

  /** Execute a plan under a budget. Never partially-applies results: either
   *  a reconciled AgentOutcome comes back, or nothing is written. */
  execute(plan: AgentPlan, budget: RunBudget): Promise<AgentOutcome>;

  /** Reconcile disagreement between agents. Returns conflicts rather than
   *  resolving them silently — a disagreement between two agents is
   *  information, not noise to be averaged away. */
  reconcile(findings: readonly AgentFinding[]): Promise<ReconciliationResult>;
}

export interface AgentObjective {
  tenantId: TenantId;
  decisionId: DecisionId | null;
  /** One sentence, in the ontology's vocabulary. */
  objective: string;
  /** Explicit. An agent never discovers its own scope. */
  scope: { vendors?: VendorId[]; products?: ProductId[]; domains?: string[] };
}

export interface AgentPlan {
  planId: PlanId;
  tasks: readonly AgentTask[];
  /** True when any task would write evidence of record or touch private
   *  tenant data. Set by the planner, checked by the control plane. */
  requiresHumanApproval: boolean;
}

export interface RunBudget {
  maxToolCalls: number;
  maxTokens: number;
  maxWallClockMs: number;
  /** No budget means no run. There is no unbounded mode. */
}

export interface ReconciliationResult {
  agreed: readonly AgentFinding[];
  /** Surfaced to a human. Never auto-resolved by majority or by confidence. */
  conflicts: readonly AgentConflict[];
}
```

`reconcile` returning conflicts instead of resolving them is the important
choice. Averaging two disagreeing agents produces a number no agent
believes, and hides the one signal worth escalating.

## 3. Evidence Agent

The first agent to build, because every other agent depends on evidence
existing.

```ts
export interface EvidenceAgent {
  /** Find candidate evidence for a claim. Returns findings, not evidence —
   *  the type name is the contract (see §4). */
  gather(request: EvidenceGatherRequest): Promise<AgentFinding[]>;

  /** Check an existing evidence record against its source. Detects silent
   *  upstream edits by comparing content_hash. Never rewrites the record;
   *  proposes a freshness transition. */
  revalidate(evidenceId: EvidenceId): Promise<RevalidationFinding>;
}

export interface EvidenceGatherRequest {
  tenantId: TenantId | "PUBLIC";
  claim: { statement: string; subject: ClaimSubject };
  /** Only registered sources. The agent cannot widen its own source set —
   *  vendor_sources is the allowlist and it is populated by reviewed,
   *  manual entry. */
  allowedSourceIds: readonly VendorSourceId[];
}

export interface RevalidationFinding {
  evidenceId: EvidenceId;
  previousContentHash: Sha256;
  currentContentHash: Sha256 | null;   // null = source unreachable
  proposedFreshness: "CURRENT" | "REVIEW_DUE" | "STALE" | "SUPERSEDED";
  /** Always false for a revalidation. A freshness change is a human call. */
  autoApplied: false;
}
```

Two constraints worth stating because they are easy to lose later:

- **`allowedSourceIds` is a closed set.** An evidence agent that can decide
  what to read is a crawler, and crawling has legal, rate-limit and trust
  consequences this product has not accepted.
- **`autoApplied: false` is a literal type**, not a default. Nothing an
  agent produces changes the evidence of record without a human.

## 4. `AgentFinding` — why it is not `Evidence`

```ts
export interface AgentFinding {
  findingId: FindingId;
  agentRunId: AgentRunId;
  tenantId: TenantId | "PUBLIC";

  /** A structured conclusion, not prose. */
  claimStatement: string;
  subject: ClaimSubject;
  stance: "SUPPORTS" | "CONTRADICTS" | "INCONCLUSIVE";

  /** Where it came from. A finding with no source reference is discarded at
   *  validation, not stored with an empty array. */
  sourcesUsed: readonly SourceReference[];
  confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";

  /** The promotion gate. A finding becomes evidence only through an
   *  explicit, audited human action — see evidence-model.md §4. */
  promotedToEvidenceId: EvidenceId | null;
}
```

A finding and a piece of evidence are different types, stored in different
tables, written by different writers. That is mechanism rather than policy:
there is no code path that turns one into the other implicitly, because
there is no implicit conversion between two unrelated types.

## 5. `AgentRun`

```ts
export interface AgentRun {
  agentRunId: AgentRunId;
  tenantId: TenantId;
  agentType: AgentType;
  decisionId: DecisionId | null;

  objective: string;
  /** A reference to the input, not the input. Inputs can be large and can
   *  contain private tenant data; the run record should not duplicate it. */
  inputReference: InputRef;

  modelProvider: string | null;
  model: ModelIdentifier | null;

  startedAt: IsoTimestamp;
  finishedAt: IsoTimestamp | null;
  status: "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "AWAITING_APPROVAL";

  /** Counts and targets. Never request/response bodies. */
  toolCalls: readonly ToolCallRecord[];
  sourcesUsed: readonly SourceReference[];
  findings: readonly FindingId[];
  confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
  errors: readonly AgentError[];

  humanApprovalRequired: boolean;
  humanApproval: { by: UserId; at: IsoTimestamp; decision: "APPROVED" | "REJECTED" } | null;
}

export interface ToolCallRecord {
  tool: string;
  target: string;          // a URL or a table reference
  startedAt: IsoTimestamp;
  durationMs: number;
  outcome: "OK" | "ERROR" | "TIMEOUT" | "BLOCKED";
  /** Hash of the result, so the run is reproducible without storing the
   *  payload. */
  resultHash: Sha256 | null;
}
```

### What is never persisted

> **Hidden chain-of-thought is never stored.** Not in a column, not in a
> JSON blob, not "temporarily" for debugging.

Stored: the objective, the plan, tool calls with targets and outcomes,
sources used, structured findings, confidence, errors, timings, and the
approval record. That is enough to audit *what happened* and to reproduce it.

Not stored: raw prompts, raw model responses, reasoning traces.

Three reasons, each sufficient on its own. It is private customer data under
a different, more dangerous classification than anything else in the system.
It is unvalidated text that would sit next to validated domain payloads and
eventually be read as if it were one. And a reasoning trace reads as
justification while being, structurally, exactly the thing the Trust Center
says can never become evidence — storing it next to evidence is the first
step to citing it.

`decision_versions` already states this rule for the decision layer. The
agent layer does not get an exception.

## 6. The conceptual agent set

Designed for, not built. Named so the control plane's `AgentType` has a
closed domain and so capability gaps are visible:

Donna Orchestrator · Evidence Agent · Vendor Intelligence Agent ·
Architecture Agent · Commercial Agent · CFO Agent · CIO Agent ·
Scenario Agent · Red Team Agent · Memory Agent · Data Economy Agent ·
Trust Agent · QA Agent

**This sprint designs two of the thirteen.** Thirteen agents built at once is
thirteen untested contracts and one unreviewable system; the Evidence Agent
has to work end to end before the second one is worth starting.

The Red Team Agent is worth naming early for a different reason: it is the
one whose job is to attack a recommendation, and a product that claims
decisions can be defended should build its adversary early rather than last.

## 7. Where runs are stored

`agents.agent_runs`, `agents.agent_findings`, `agents.tool_calls` in Iceberg
(append-only history). Conflicts and pending approvals live in **Postgres**,
because a human has to act on them and that needs RLS, low latency and
`UPDATE` — see [`architecture.md`](./architecture.md) §4.6.
