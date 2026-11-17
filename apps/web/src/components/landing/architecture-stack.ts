/**
 * The homepage's Platform Architecture section (brief §12) — a
 * deliberately smaller stack than the full Intelligence Fabric diagram
 * in docs/intelligence-fabric/architecture.md, matching exactly what
 * the brief asks the homepage to show: Experience Layer → Donna
 * Orchestrator → Agent Control Plane → Decision Engine → {Evidence
 * Graph, Scenario Engine, Decision Memory, Enterprise Ontology} →
 * Enterprise Data & Systems.
 *
 * Every `status` below was set by checking the actual repository, not
 * asserted for effect — see each layer's own comment for what that
 * check found. "Available" means a visitor can use it in production
 * today; "Planned" means a real, partial implementation exists and is
 * being built toward; "Architectural direction" means a design exists
 * (often a committed document) and nothing has been built yet. This is
 * the same three-tier distinction the brief names explicitly and asks
 * never to be blurred.
 */
export type ArchitectureStatus = "available" | "planned" | "direction";

export interface ArchitectureLayer {
  id: string;
  label: string;
  note: string;
  status: ArchitectureStatus;
}

export const ARCHITECTURE_STACK: ArchitectureLayer[] = [
  {
    id: "experience",
    label: "ClouDonna Experience Layer",
    note: "The product you are using right now.",
    status: "available",
  },
  {
    id: "orchestrator",
    label: "Donna Orchestrator",
    note: "Routes a decision to the right provider today (deterministic or OpenAI-narrated); the fuller multi-agent version is designed, not yet built — see docs/founder-agent/architecture.md.",
    status: "planned",
  },
  {
    id: "agent-control-plane",
    label: "Agent Control Plane",
    note: "Run registry, budget, and audit for specialized agents — an interface design (docs/intelligence-fabric/agent-runtime.md), not yet implemented.",
    status: "direction",
  },
  {
    id: "decision-engine",
    label: "Decision Engine",
    note: "The deterministic scoring engine behind every recommendation on this site. Same input, same score, every time.",
    status: "available",
  },
];

/** The facets below the Decision Engine — shown side by side, not
 * stacked, because none of them depends on the others running first.
 *
 * Website Perfection & SEO Release Gate (claim audit, brief §20):
 * Research Agent and Business Case Engine shipped to production after
 * this list was first written and were missing entirely — the public
 * site was understating what is actually live. Added below, each
 * checked against its own real repository state, not asserted for
 * effect. */
export const ARCHITECTURE_FACETS: ArchitectureLayer[] = [
  {
    id: "research-agent",
    label: "Research Agent",
    note: "Live evidence retrieval and claim extraction against real sources, with gap and conflict detection — available today from inside a saved decision.",
    status: "available",
  },
  {
    id: "evidence-graph",
    label: "Evidence Graph",
    note: "A real provenance table exists today (source, reliability, verification status); the full claim/evidence graph is a v0.1 design.",
    status: "planned",
  },
  {
    id: "scenario-engine",
    label: "Scenario Engine",
    note: "Live in /scenario-lab — the same deterministic model that answers \"what changes if this assumption does.\"",
    status: "available",
  },
  {
    id: "business-case-engine",
    label: "Business Case Engine",
    note: "Deterministic TCO, ROI, NPV and payback over 1, 3 and 5-year horizons — live inside the Decision Command Center.",
    status: "available",
  },
  {
    id: "decision-memory",
    label: "Decision Memory",
    note: "Append-only, versioned, live today — every saved decision keeps its full history.",
    status: "available",
  },
  {
    id: "enterprise-ontology",
    label: "Enterprise Ontology",
    note: "A v0.1 design for the shared vocabulary future agents will speak — not a runtime dependency yet.",
    status: "direction",
  },
];

export interface IntegrationBadge {
  name: string;
  status: ArchitectureStatus;
}

/** "Enterprise Data & Systems" — every one of these is honestly
 * architectural direction today: no live connector exists to any of
 * them yet. Naming them anyway, and saying so plainly, is more honest
 * than omitting the roadmap or implying one is further along than it
 * is. */
export const INTEGRATION_BADGES: IntegrationBadge[] = [
  { name: "SAP", status: "direction" },
  { name: "Microsoft", status: "direction" },
  { name: "Databricks", status: "direction" },
  { name: "Snowflake", status: "direction" },
  { name: "AWS", status: "direction" },
  { name: "Google Cloud", status: "direction" },
];
