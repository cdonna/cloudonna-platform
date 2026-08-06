# Donna Score v2 — Scoring Model

**Module:** `apps/web/src/components/donna-ai/scoring/`

## What changed from v1

The Sprint 2 engine produced one formula (`34 + 15×matchedTraits`, capped at 98) and three fit
categories (architecture/business/technology). This is a genuine refactor, not an extension: ten
named, independently-computed, independently-weighted dimensions, each returning its own
positive and negative evidence.

## The ten dimensions

| Dimension | Weight | Primary signal |
|---|---|---|
| Architecture Fit | 15% | Trait overlap between your landscape/goals/constraints and the platform's traits |
| Business Fit | 12% | Your industry/company size vs. the platform's `supportedIndustries`/`supportedCompanySizes` |
| Technology Fit | 12% | Architecture-relevant trait overlap + AI readiness band, weighted toward AI readiness if you selected an AI-related goal |
| Governance Fit | 10% | `governanceCapability` band, adjusted if you selected a governance/data-products/compliance goal |
| AI Readiness | 10% | `aiReadiness` band, small bonus if you already have an AI platform in your landscape |
| Security Fit | 10% | `securityPosture` band, adjusted for a low risk appetite |
| Cost Fit | 10% | `costTier`, softened if your budget is flexible, penalized fully if tight |
| Ecosystem Fit | 8% | `ecosystemStrength` + `partnerNetwork` bands, adjusted for limited internal skills |
| Time-to-Value Fit | 8% | `timeToValue` band, softened if your timeline is extended |
| Strategic Fit | 5% | How many of your selected goals map to a trait this platform actually has |

Weights sum to 1.0 and live in exactly one place: `scoring/weights.ts` → `SCORE_WEIGHTS`. There
is no other, hidden weighting anywhere in the codebase — the overall score is a direct weighted
sum: `Σ(dimension.score × dimension.weight)`.

### Why this weighting

Documented directly in `weights.ts` as a code comment, not just here: Architecture, Business,
and Technology fit are weighted highest because they determine whether the platform can do the
job at all. Governance, AI Readiness, Security, and Cost are next — real differentiators, but
secondary to basic fit. Ecosystem and Time-to-Value matter but are about delivery experience more
than platform capability. Strategic Fit is weighted lowest deliberately — it's a goal-alignment
lens on top of a fit the other nine dimensions already establish, not an independent measure.

## Determinism

Every dimension scorer in `scoring/engine.ts` is a pure function: `(state, platform) →
DimensionResult`. No randomness, no external calls, no hidden state. The same wizard input
always produces the same score, every time — this is what "explainable" means in practice: you
can trace any number back to the specific rule that produced it.

## Confidence Score

Distinct from Donna Score. Confidence measures how much you told Donna, not how good the match
is:

```
confidence = 55 + 6 × (steps with valid input, max 4) + 5 × (free-text notes written, max 4)
             − 10 if the top recommendation's Architecture Fit found zero positive evidence
```

Capped at 96 (never claims full certainty) and floored at 30. The signal-quality penalty is new
in v2 — a fully-filled-in form that still produces a weak-signal recommendation (see below) now
correctly reports lower confidence, not just "the form was complete."

## Low-signal input

Not every valid combination of chip selections activates a scoring trait — Oracle ERP,
"Planning" as a goal, and neutral constraints are all legitimate picks that don't map to
anything in the current 15-trait set. When Architecture Fit finds zero positive evidence, the
Executive Summary and "Why this recommendation?" section switch to an explicit low-signal
message rather than fabricating a reason. This behavior was carried over from v1 and re-verified
against the v2 evidence-collection path.

## Explainability output

`buildDecisionOutput()` collects evidence across all ten dimensions into two flat lists:
`positiveEvidence` and `concerns` (each capped at 6 items, tagged with which dimension produced
them — see `EvidenceItem` in `scoring/types.ts`). This is what Phase 4's explainability
requirement maps to directly: every recommendation can point to exactly which dimension, and
which rule within that dimension, produced each piece of evidence.

## Known limitations

- Ten dimensions is a fixed set for this sprint — adding an eleventh means touching
  `ScoreDimensionKey`, `SCORE_WEIGHTS`, `SCORE_DIMENSION_LABELS`, and adding a scorer function.
  Not a plugin architecture (deliberately, to avoid over-engineering for a sprint with no second
  consumer yet).
- Weight values (0.15, 0.12, etc.) are a reasoned starting point, not derived from any
  statistical model — they're centralized and documented specifically so they're easy to revisit.
