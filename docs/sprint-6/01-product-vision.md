# Sprint 6 — 01. Product Vision

## The thesis

A recommendation that disappears the moment the browser tab closes is a demo. A recommendation that is saved, versioned, explained, challenged, approved, implemented, and measured — and can be replayed a year later to show exactly what was known and why — is an enterprise system of record. Sprint 6 is the sprint where ClouDonna stops being the first kind and becomes the second.

## System of Intelligence + System of Record + System of Trust

- **System of Intelligence** (built, Sprints 3 and 5): a deterministic, explainable engine that turns business goals into a ranked, evidenced recommendation, with an AI layer that narrates but never decides.
- **System of Record** (Sprint 6): every recommendation an organization acts on becomes a durable, owned, versioned asset — not a session that evaporates.
- **System of Trust** (Sprint 6, and the harder half): a saved decision is provably what it says it is. The right evidence. The right engine version. Visible only to who should see it. Unmodifiable after the fact. Explainable to a skeptical auditor eighteen months later.

## The chain, restated with its new terminal step

```
Business Goals → Capabilities → Solution Patterns → Technology Patterns
→ Vendor Recommendations → Decision → Decision Memory → Business Outcome
```

Everything left of "Decision" already exists and is unchanged by Sprint 6. **"Decision Memory" and "Business Outcome" are the two links Sprint 6 adds to the chain.** Without them, the chain dead-ends at a screenshot. With them, a decision becomes traceable all the way to whether it actually worked — which is the difference between a scoring tool and a decision platform.

Technology remains the *outcome* of this chain, never its starting point — the one architectural commitment that has held since Sprint 3 and is not renegotiated here.

**Addendum (architecture extension pass):** the chain above is the Sprint 6-scoped version. The full authoritative chain, extended with the structured-knowledge stages this package adds, is:

```
Business Goals → Capabilities → Business Processes → Requirements → Constraints
→ Solution Patterns → Architecture Patterns → Technology Patterns
→ Vendors → Products → Evidence → Recommendation → Decision
→ Implementation → Outcome → Decision Memory → Lessons Learned
```

Everything between "Technology Patterns" and "Vendors" through "Evidence" is today implicit in code (the hardcoded `vendor-intelligence/catalog.ts` and Sprint 5's evidence-package construction) — `13-knowledge-graph.md` and `15-evidence-engine.md` give it explicit structure. This does not change the chain's meaning, only makes more of it queryable data instead of code.

## Non-negotiable principles, and how Sprint 6 keeps each one true

| Principle | How it stays true after Sprint 6 |
|---|---|
| Vendor-neutral forever | No table, RLS policy, or scoring path in this plan is influenced by commercial relationship. Persisted scores are copies of the same deterministic computation that runs today. |
| Business-first | The chain above starts at Business Goals, not Vendor. **Correction (architecture extension pass):** this row originally named `decision_reports` as the storage table; Sprint 6.1's actual implementation built `decisions`/`decision_versions` instead and left `decision_reports` (Sprint 4) unused — see `docs/sprint-6/18-persistence-schema.md`'s own disclosure of this decision and `docs/roadmap/10-release-sequencing.md`'s gap analysis. The principle holds; the table name in this sentence was wrong once implementation happened. |
| Deterministic scoring remains authoritative | Sprint 6 adds zero new scoring logic. Persisted `deterministic_output` is a byte-identical copy of what `DecisionEngine.evaluate()` already produces. |
| AI enriches, never decides | `enrichment` persists as validated `IntelligenceEnrichment` — still has no numeric field, still schema-`.strict()`, still passes through the same claim validators before it can be saved. |
| Human remains decision authority | Approval is a human click, gated by role, logged. No automated approval path exists anywhere in this plan. |
| Full auditability | Every state transition, save, and approval writes an `audit_logs` row — metadata only, real events, not a bolt-on log statement. **Correction (architecture extension pass):** Sprint 6.1's actual implementation did not write to `audit_logs` at all — this table remains unused. This principle was stated here as a design intent before implementation proved it out, and the gap is real, not yet closed. See `docs/sprint-6/21-security-review.md`'s own disclosure and `docs/roadmap/10-release-sequencing.md`'s gap analysis, which independently flagged the same thing. |
| Complete explainability | Decision Replay (`07-replay.md`) exists specifically so "why did we recommend this, and would we still" has a real, honest answer months later. Extended by `23-explainability-layer.md`'s twelve named outputs and `15-evidence-engine.md`'s evidence tracing. |
| Enterprise-grade security | RLS as the primary isolation control, server-only secrets, no raw provider data ever persisted — detailed in `08-security.md`. |
| Multi-tenant by design | Organization → Workspace → Project → Decision, with `organization_id` denormalized onto every row, per the schema already in `main`. |
| Privacy by default | Nothing saves without an explicit user action; unauthenticated use remains fully stateless, forever. |

## What "enterprise-grade" means here, concretely

Not a slogan — three specific, checkable commitments this document set holds itself to:

1. **Nothing ships that can't be explained to a security reviewer in one sentence.** If a design decision needs three paragraphs of justification, it's probably the wrong design decision, not a documentation problem.
2. **No feature outruns the trust model.** Versioning, replay, and outcome tracking are only as valuable as the tenant isolation and immutability guarantees underneath them — those guarantees are built first (Phases 6.1–6.4), features on top of them second.
3. **The unauthenticated experience never degrades.** A prospect trying Donna for the first time gets the exact same fast, stateless, no-account-needed experience after Sprint 6 as before it. Enterprise depth is additive, never a tax on the simple path.

## Strategic extensions (added in the architecture extension pass)

Four areas extend this document's scope, detailed in their own documents rather than duplicated here: Knowledge Graph (`13-knowledge-graph.md`), Evidence Engine (`15-evidence-engine.md`), Explainability Layer (`23-explainability-layer.md`), Outcome Intelligence (`25-outcome-intelligence.md`, complementing `docs/roadmap/09-outcome-intelligence.md`). All four are additive to the principles above, not a revision of them — the "Non-negotiable principles" table's guarantees (deterministic authority, vendor neutrality, human governance) apply identically to every new capability these four documents describe.

## Explicitly out of scope

Marketplace, commission engine, billing, PDF/PowerPoint export, autonomous agents, chatbot, live vendor pricing, crawling, analytics warehouse. None of these are partially built, stubbed, or seamed in this plan — they are simply absent, restated here so no later document quietly reintroduces one.
