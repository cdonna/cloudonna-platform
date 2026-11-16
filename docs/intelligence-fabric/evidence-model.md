# Evidence Model

**Status:** Design only. The operational provenance layer that exists today
is `vendor_sources` / `vendor_evidence` / `vendor_source_change_log` (see
`supabase/migrations/20260809100000_vendor_intelligence_registry.sql`). This
document designs the typed model the Fabric needs, and names the delta.

---

## 1. The rule everything else serves

> **Agent interpretation must never automatically become trusted evidence.**

The Trust Center states this publicly: *"AI interpretation is never promoted
to verified evidence. It is labeled as interpretation wherever it appears, it
cannot change a score, and it cannot become the source another claim cites."*
A published promise needs a structural mechanism, not a convention. §4 is
that mechanism.

## 2. Evidence types

```ts
export type EvidenceSourceType =
  | "OFFICIAL_SOURCE"   // vendor/standards documentation, release notes, API refs
  | "CUSTOMER_SOURCE"   // a document or statement the customer provided
  | "OBSERVED_DATA"     // measured behaviour of a system
  | "CALCULATED"        // derived deterministically from other records
  | "AGENT_INFERENCE"   // an LLM/agent reading of other records
  | "ASSUMPTION"        // a stated gap standing in for a claim
  | "HUMAN_INPUT";      // a named person's judgement, on the record
```

How each may be used:

| Type | May support a scored Claim | Requires a source URL | Expires |
|---|---|---|---|
| `OFFICIAL_SOURCE` | yes | yes | yes — `freshness` |
| `CUSTOMER_SOURCE` | yes, about that tenant only | no | yes |
| `OBSERVED_DATA` | yes | no — carries a measurement reference | yes |
| `CALCULATED` | yes, if every input may | no — carries input references | with its inputs |
| `AGENT_INFERENCE` | **no — never** | no | n/a |
| `ASSUMPTION` | no — supports a *Recommendation*, visibly | no | on review |
| `HUMAN_INPUT` | yes, attributed | no | yes |

`CUSTOMER_SOURCE` is *fact about that customer, never fact about the market* —
the same wording the public Trust Center uses. It is also why it is
physically tenant-isolated (`architecture.md` §5).

## 3. The record

```ts
export interface EvidenceRecord {
  id: EvidenceId;
  /** PUBLIC intelligence, or the owning tenant. Never null, never inferred
   *  from ambient context. See architecture.md §5. */
  tenantId: TenantId | "PUBLIC";

  sourceType: EvidenceSourceType;
  sourceName: string;
  sourceUrl: string | null;
  title: string | null;

  /** When ClouDonna fetched it. */
  retrievedAt: IsoTimestamp;
  /** When the source itself says it became true. Distinct from retrievedAt,
   *  and the distinction is the whole point: a document retrieved today can
   *  describe a state of the world from two years ago. */
  effectiveDate: IsoDate | null;
  lastReviewedAt: IsoTimestamp | null;

  /** Hash of the raw bytes in raw.*. Makes "this is what it said" provable
   *  rather than asserted, and makes a silent upstream edit detectable. */
  contentHash: Sha256;

  freshness: "CURRENT" | "REVIEW_DUE" | "STALE" | "SUPERSEDED";
  confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
  /** What this is valid *for*. An unscoped claim is an overclaim. */
  scope: string;

  vendorId: VendorId | null;
  productId: ProductId | null;
  domain: string | null;

  /** The assertion. A Claim reference, not free text — see §5. */
  claimId: ClaimId;
  rawReference: RawObjectRef | null;

  createdByAgent: AgentType | null;
  model: ModelIdentifier | null;
  decisionId: DecisionId | null;
}
```

**`confidence` and `freshness` are separate axes, deliberately.** A current
source can be low-confidence (one vendor's own marketing page); a stale
source can be high-confidence (a signed contract from 2023). Collapsing them
into one "quality" score is the false-precision failure this product exists
to avoid — the same reason `globals.css` keeps the confidence palette
structurally separate from the score palette.

`INSUFFICIENT` is a real value, not a null. "We do not know enough" is an
answer the model must be able to state.

## 4. The structural separation of evidence from interpretation

Three mechanisms, not one, because a single rule is a convention and
conventions erode:

**1. Different relation.** `AGENT_INFERENCE` records cannot participate in
`Evidence SUPPORTS Claim`. They participate only in:
```
AgentInference  INTERPRETS  Evidence[]  →  producing a narrative
```
There is no edge by which an inference reaches a Claim, so no query that
assembles supporting evidence can return one. This is enforced by the edge
types, not by a filter someone has to remember to write.

**2. Different write path.** Evidence of record is written by the projection
job or by a reviewed human action. Agent output is written to
`agents.agent_findings`, a different table, by a different writer. Promotion
from finding to evidence is an explicit, audited, human action — never an
automatic status change.

**3. Different surface.** `EvidenceTag` renders `ai-interpretation` with no
colour of its own and a dashed border, while every actual evidence type gets
a solid, coloured treatment. The visual language and the data model say the
same thing, so a reader can see the distinction without reading this
document.

The existing code already enforces the strongest version of this at the
decision layer: the deterministic engine computes the score, and the
`IntelligenceProvider` only narrates an `EvidencePackage` it had no part in
assembling (`docs/intelligence/provider-boundaries.md`). The Fabric extends
that boundary into storage rather than inventing a new one.

## 5. Claim

From [`ontology-v0.1.md`](./ontology-v0.1.md) §3 — the one structural change
v0.1 asks for:

```ts
export interface Claim {
  id: ClaimId;
  tenantId: TenantId | "PUBLIC";
  /** The assertion, as one checkable sentence. */
  statement: string;
  subject: { kind: "PRODUCT" | "VENDOR" | "CAPABILITY" | "ARCHITECTURE"; id: string };
  /** Derived from its evidence, never set by hand. A claim with supporting
   *  and contradicting evidence is CONTESTED, and says so. */
  status: "SUPPORTED" | "CONTESTED" | "UNSUPPORTED" | "SUPERSEDED";
}
```

`CONTESTED` is why the separation matters. Today, two sources disagreeing
produce two `vendor_evidence` rows that read as two independent facts. With
`Claim`, they read as one claim with conflicting support — which is the
truth, and which the Scenario Engine and the Red Team agent both need.

## 6. Delta from what exists

| Needed | Today | Gap |
|---|---|---|
| `source_type` with 7 types | `vendor_source_type` (6 official variants) + `evidence_signal_type` | Needs `AGENT_INFERENCE`, `ASSUMPTION`, `HUMAN_INPUT`, `CALCULATED` as peers |
| `effective_date` vs `retrieved_at` | `published_at` + `observed_at` | **Already correct** — the two-date distinction exists |
| `content_hash` | — | Missing. Without it, provenance is a URL and a promise |
| `freshness` | `last_verified_at` (timestamp) | Needs the derived band, and `SUPERSEDED` |
| `confidence` | `confidence numeric(3,2)` | Numeric 0–1 implies precision the inputs don't have; bands are more honest |
| `scope` | — | Missing, and it is the most common overclaim |
| `claim_id` | `fact text` | Missing — the §5/§3 conflation |
| `tenant_id` | Public catalog only | Private evidence has no home yet |
| `created_by_agent`, `model` | — | Missing |

`verification_status` and `reliability` already exist and already reuse the
Sprint 4 enums rather than a parallel taxonomy. They stay.

## 7. What is never stored

Raw prompts, raw model responses, and chain-of-thought — in any column, under
any name. `decision_versions` already states this and it is not relaxed here.
What is stored is the structured finding and its provenance. See
[`agent-runtime.md`](./agent-runtime.md) §5.
