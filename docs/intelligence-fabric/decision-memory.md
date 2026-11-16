# Decision Memory

**Status:** Design only for the analytical layer. The operational layer
**already exists and is already immutable**: `decisions` and
`decision_versions` (`supabase/migrations/20260806130100_sprint6_1_decisions.sql`),
append-only by construction — no `updated_at`, no `deleted_at`, and no UPDATE
or DELETE policy for any regular role.

---

## 1. The five questions

Decision Memory exists to answer these, and the design is judged only on
whether it can:

1. Why did we make this recommendation?
2. What evidence existed at the time?
3. Which assumptions existed?
4. What has changed since?
5. **Would the recommendation still hold today?**

Questions 1 and 3 are answerable today. Question 2 is nearly answerable.
Questions 4 and 5 are not, and they are the valuable ones.

## 2. What already works

`decision_versions` stores, per version: `decision_input_json`,
`deterministic_output_json`, `validated_enrichment_json`,
`evidence_references_json`, `change_reason`, `created_by`, `generated_at` —
and three stamps that turn out to be the key to question 5:

```
schema_version          scoring_engine_version          knowledge_base_version
```

**Question 1** is answered by `deterministic_output_json` plus
`validated_enrichment_json`: the recommendation, its reasoning, trade-offs,
risks and assumptions as validated domain payloads.

**Question 3** is answered by the assumptions inside
`deterministic_output_json` — though they are not separately addressable,
which is the gap `memory.assumption_changes` closes.

## 3. The gap, precisely

`evidence_references_json` records *which* evidence a version cited. It does
not record **what that evidence said at the time**. If a vendor silently
edits a documentation page, the reference still resolves — to different
content. The historical record then describes a decision made on evidence
that no longer exists, without knowing it.

That is the gap `memory.evidence_snapshots` closes, and `content_hash`
(`evidence-model.md` §3) is what closes it.

## 4. The snapshot model

```
memory.decision_versions        ← projection of the Postgres table, plus the
                                  resolved evidence set
memory.evidence_snapshots       ← the evidence *content*, pinned by hash
memory.assumption_changes       ← one row per assumption transition
memory.recommendation_changes   ← one row per recommendation transition
memory.scenario_runs            ← every what-if ever evaluated
memory.outcomes                 ← what actually happened, recorded later
```

**`memory.evidence_snapshots`** is one row per
`(decision_version_id, evidence_id, content_hash)` carrying the full
`EvidenceRecord` as it stood, plus the statement of its Claim. It is written
once, at decision time, and never updated. The raw bytes live in `raw.*`
under the same hash.

Three invariants, in priority order:

1. **A historical snapshot is never mutated.** Not corrected, not enriched,
   not re-hashed. A correction is a *new version* with a `change_reason`.
2. **A snapshot is self-contained.** Reading a 2027 decision must not depend
   on a 2029 catalog row still existing or still meaning the same thing.
3. **Every snapshot carries its engine stamps.** Without
   `scoring_engine_version`, replay is not defined.

### Why immutability is not negotiable here

The product's differentiating claim is that a decision can be defended later.
A record that can be quietly improved cannot defend anything — and the
failure is silent, which is the worst property a trust mechanism can have.
`decision_versions` already took this position in SQL; the Fabric does not
weaken it for convenience. See
[ADR-0005](../adr/0005-immutable-decision-memory-snapshots.md).

## 5. Question 4 — what changed

A diff between the pinned snapshot set and today's state, in four classes.
Each class already has a name in the product, because the homepage's 05
Remember step shows exactly these:

| Class | Detected by | Shown as |
|---|---|---|
| Evidence updated | `content_hash` differs, or `freshness` moved to `SUPERSEDED` | "Evidence updated" |
| Assumption changed | an `ASSUMPTION` resolved to a Claim, or was contradicted | "Assumption changed" |
| Vendor condition changed | `core.pricing_models` / `core.products` history shows a transition | "Vendor condition changed" |
| Criterion weight changed | the decision's own framework was re-weighted | "Review triggered" |

`version-diff.ts` already computes version-to-version diffs operationally.
This is the same idea extended to *world-to-snapshot*.

## 6. Question 5 — would it still hold

This is computable rather than a judgement call, and the reason is that the
scoring engine is **deterministic and versioned**.

```
replay(decisionVersion, asOf = now):
  1. load the pinned input           (decision_input_json — never re-derived)
  2. resolve evidence as of `asOf`   (AnalyticalStore.queryAsOf — Iceberg time travel)
  3. run the engine at the *recorded* scoring_engine_version
  4. diff the resulting ranking against the recorded one
  5. classify
```

Step 3 is the subtle one. Replaying at *today's* engine version conflates two
different questions — "did the world change?" and "did we change our mind
about how to weigh things?" — and would report a model improvement as a
world event. So replay runs at the recorded version by default, and running
at the current version is a separate, explicitly-labelled operation.

That requires every scoring engine version to remain executable, which means
engine versions are retained, not replaced. The cost is real and it is the
price of the claim.

Outcomes:

| Result | Meaning | Surface |
|---|---|---|
| Same leader, same margin class | Nothing material moved | **Recommendation still holds** |
| Same leader, margin narrowed below the close-call threshold | Still right, now contested | **Recommendation still holds**, with a close-call note (`result-credibility.ts` already models this) |
| Different leader | The world moved past the decision | **Decision requires review** |
| Evidence missing or superseded beyond a threshold | Cannot be re-evaluated honestly | **Decision requires review** — never "still holds" |

The last row matters most: **insufficient evidence resolves to "requires
review", never to "holds".** Defaulting to "holds" would be the convenient
answer and a false one, and `confidence: "INSUFFICIENT"` exists in the
evidence model for exactly this.

## 7. `memory.outcomes`

What actually happened, recorded after the fact — the only table here whose
rows are written long after the decision. The illustrative case study on the
public site already demonstrates the honest shape: reviewed eighteen months
later, the governed core shipped on time, *and* the companion-platform
assumption turned out to be wrong in the other direction. An outcomes table
that only records vindication is a marketing asset, not a memory.

## 8. Not in scope this sprint

No migration, no projection job, no replay implementation, no retention
policy. `decision_versions` keeps working exactly as it does today.
