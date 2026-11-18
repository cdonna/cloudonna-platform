# Capability: Decision Workspace & Agentic Experience V1

**Branch:** `agent/decision-workspace-agentic-experience-v1`. Turns `/app/decisions/[id]` from a flat stack of separately-built panels into one coherent Decision Workspace, organized around the canonical UNDERSTAND → EVIDENCE → COMPARE → SIMULATE → CHALLENGE → DECIDE → ALIGN → REMEMBER lifecycle. Every existing engine (Decision Engine, Research Agent, Vendor Intelligence, Evidence Graph, Business Case, Scenario, Challenger, Decision Memory) is reused as-is — this sprint built an integration shell and a handful of pure composition functions, not new scoring or financial logic.

## What already existed vs. what this sprint added

Nearly every capability leaf component already existed (`ConstraintsView`, `EvidenceExplorer`, `ResearchPanel`, `ScenarioWorkbench`, `BusinessCasePanel`, `ChallengerPanel`, `VendorKnowledgePanel`, `ExecutiveRecommendationBlock`, `HumanDecisionPanel`, `ExecutiveBrief`, `DecisionTimeline`, `VersionControls`, `VersionDiffPanel`), as did the underlying engine output (`EngineResult`'s confidence, evidence diagnostics, constraints, scenarios, challenges, business case, executive recommendation). This sprint's genuinely new work:

- **`components/donna-ai/workspace/`** — `decision-readiness.ts` (LOW/MEDIUM/HIGH, never a fake percentage), `lifecycle-stage.ts` (stage completion + current stage, both pure functions over real state), `next-best-action.ts`, `workspace-status.ts` (display-only richer status label), `recent-activity.ts`.
- **`decision_stakeholders` / `decision_action_items`** (new migration, tenant-scoped) — the Align stage's only genuinely new schema; every other stage is built from tables that already existed.
- **`DecisionWorkspace.tsx`** — the new top-level orchestrator: persistent header, lifecycle navigation, Executive/Analyst mode toggle, and the eight stage components that compose the existing leaf panels.
- **`OptionMatrix.tsx`** — a new, genuinely vendor-neutral per-option comparison view (strengths/weaknesses/constraints/economics per option), since no existing component presented scoring this way.

## Neutrality firewall

The existing `commercial-neutrality-firewall.test.ts` gained a narrowing fix: the prior Revenue Operations sprint's blanket "no file under `donna-ai/` imports `lib/decision-outcomes/`" rule was too broad once the Remember stage legitimately needed to display `decision_outcomes`/`business_case_actuals`/`assumption_validations` — narrowed to the actual neutrality-sensitive surface (`scoring/` and `engine/` only). `buyer-persona.ts` isolation remains checked against the whole `donna-ai/` tree, since that one has no legitimate product-UI use case anywhere in the decision product.

## Security

`decision_stakeholders`/`decision_action_items` carry `is_org_member()` RLS, identical posture to `decisions`/`decision_versions`. Both verified live in production via direct SQL against `information_schema`/`pg_class.relrowsecurity`/`pg_policies`, not migration bookkeeping.

## Known limitations

- The Decision Frame (Understand stage) is read-only in this version — editing still goes through the existing "Save as new version" flow (`AppendVersionAction`), not an inline editor, to avoid duplicating the intake wizard's own reducer.
- "Recent Donna Activity" is built from version `change_reason` history and vendor-knowledge `decision_impacts` only — no research-session-level activity feed yet (would need a new `listResearchSessionsForDecision` repository function).
- "Investment at stake" in the header is the recommended option's own modeled TCO when a business case exists, and "Not yet modeled" otherwise — deliberately never sourced from `commercial_opportunities` (platform-staff-only, and not reachable under tenant RLS anyway).
- Executive Mode condenses Evidence/Simulate/Challenge into a one-line summary; it does not yet restrict Compare/Align to a shorter list as brief §46 describes for a maximally minimal executive view.
