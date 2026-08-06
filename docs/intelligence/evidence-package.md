# The Evidence Package

**Files:** `intelligence/types.ts` (shape), `intelligence/knowledge-provider.ts` (builder)

`EvidencePackage` is the entire universe of fact any `IntelligenceProvider`
is allowed to see — both providers shipped so far (the deterministic
templater and `createOpenAIIntelligenceProvider`) receive exactly the same
package, built the same way, with no provider-specific carve-out. It is
built once, by `KnowledgeProvider.buildEvidencePackage(input, output)`,
from an already-computed `DeterministicDecisionOutput`. Nothing in that
function scores, matches, or ranks anything new.

## Shape

```ts
interface EvidencePackage {
  decisionContext: { goals: string[]; industry: string | null; companySize: string | null };
  shortlist: EvidencePlatform[];              // primary + up to 2 alternatives
  matchedCapabilities: string[];
  candidateSolutionPatterns: string[];
  candidateTechnologyPatterns: string[];
  candidateArchitecturePatterns: string[];    // always [] this phase — see below
  sourceReferences: EvidenceSourceReference[];
  knownInformationGaps: string[];
  deterministicRisks: string[];
  deterministicOpportunities: string[];
  deterministicAssumptions: string[];
  deterministicNextSteps: Array<{ text: string; horizon: "now" | "next" | "later" }>;
  deterministicWorkshops: Array<{ title: string; description: string }>;
}
```

## Why only three platforms

The full vendor catalog (10 platforms today, designed to scale to
thousands per the Sprint 4 data foundation) is never sent anywhere.
`shortlist` is capped at `MAX_SHORTLIST_SIZE = 3` — the primary
recommendation plus up to two alternatives, exactly what the deterministic
engine already surfaced as `output.recommendation` and
`output.alternatives`. This is both a privacy/cost control (see the Sprint
5 Phase 1 architecture doc, §16/§20) and a correctness one: there is no
reason for a narrative layer to discuss a platform Donna's own scoring
didn't consider relevant.

## Field-by-field provenance

| Field | Derived from | Newly computed? |
|---|---|---|
| `decisionContext` | `WizardState.goals`/`company` via existing option-label lookups | No — relabeling only |
| `shortlist[].dimensionScores` | `RankedPlatform.dimensions` | No — copied |
| `shortlist[].positiveEvidence`/`negativeEvidence` | `DimensionResult.positiveEvidence`/`negativeEvidence` | No — copied |
| `matchedCapabilities` | `VendorPlatformProfile.integrationStrengths` across the shortlist | No — selected |
| `candidateSolutionPatterns` | `VendorPlatformProfile.vendorCategory` across the shortlist | No — relabeled |
| `candidateTechnologyPatterns` | `VendorPlatformProfile.architectureCharacteristics` | No — relabeled |
| `candidateArchitecturePatterns` | — | **Always `[]`** — see below |
| `sourceReferences` | `VendorPlatformProfile.sourceNotes`, tagged `"internal_review"` | No |
| `knownInformationGaps` | Platforms with zero positive evidence on every dimension, plus a low-`confidenceScore` flag | No — a threshold check on existing numbers |
| `deterministicRisks`/`Opportunities`/`Assumptions`/`NextSteps`/`Workshops` | `DecisionOutput.risks`/`.opportunities`/`.assumptions`/`.nextSteps`/`.workshops` | No — copied verbatim |

## `candidateArchitecturePatterns` is always empty — honestly

Sprint 4's database schema has an `architecture_patterns` table and a
real `product_technology_patterns` join, added specifically because
designing the Enterprise Intelligence Graph surfaced that the in-memory
catalog had no such link. That schema is not wired to
`vendor-intelligence/catalog.ts` — nothing populates it. Rather than fake
this field from `architectureCharacteristics` a second time (already used
for `candidateTechnologyPatterns`, which would make the two fields
redundant and misleading), it's left honestly empty, with this note, until
a real architecture-pattern taxonomy exists in the in-memory model.

## Evidence reliability

`EvidenceSourceReference.reliability` uses the same vocabulary as Sprint
4's `evidence_reliability_tier` Postgres enum (`primary_source` |
`vendor_published` | `analyst_report` | `internal_review`) for continuity,
even though this phase only ever produces `"internal_review"` (the vendor
catalog's own curator-written `sourceNotes`). The other tiers exist in the
type for when a real `evidence_sources`/`analyst_reports` pipeline (Sprint
4, unwired) starts feeding this.
