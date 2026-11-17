# Capability: Decision Model & Enterprise Business Case Engine

**Branch:** `agent/decision-model-business-case-v2`. Builds on Decision Engine V1/V1.1
(`docs/capabilities/decision-memory.md`) and Research Agent V1
(`apps/web/src/components/donna-ai/research/`). No new migration — see §10.

## Mission

Give ClouDonna's recommendation an economic and adversarial layer, without letting either
layer silently move the score. A user must be able to ask "should we invest in SAP BDC,
Databricks, Microsoft Fabric, Snowflake, Google Cloud, Oracle, or a hybrid architecture?" and
get: an architectural answer (existing Decision Engine), supporting/unknown evidence (Research
Agent V1), cost-over-time and value created (this capability's Business Case Engine), what
could flip the recommendation (this capability's Challenger Agent), and which lens — strategic,
architecture, or economic — actually wins and whether they agree (Executive Recommendation).

## A. Why no new entity model, and no graph database

The brief's CDM (§2) names 19 entity types. Every one of them already has a concrete home in
this codebase; this capability does not introduce a parallel structure, a graph database, or a
new storage layer. The mapping:

| CDM entity | Concrete type today |
|---|---|
| Decision | `decisions` row + `DecisionVersion` (`persistence/decisions-repository.ts`) |
| Enterprise | `WizardState.company` + `EnterpriseContext` (new, §E) |
| Option | `RankedPlatform` (`scoring/types.ts`) |
| Vendor | `VendorPlatformProfile.vendor` (`vendor-intelligence/types.ts`) |
| Product | `VendorPlatformProfile.productName` |
| Capability | `VendorPlatformProfile`'s `MaturityBand` fields (governance, security, aiCapabilities, …) |
| Architecture | `VendorPlatformProfile.architectureCharacteristics` + `cloudModel`/`deploymentModels` |
| Criterion | `ScoreDimensionKey` (`scoring/types.ts`) — the 10 scored dimensions |
| Constraint | `ConstraintsInput` (`types.ts`) + `engine/constraints.ts` evaluations |
| Evidence | `EvidenceItem` (`scoring/types.ts`) and, for live-sourced evidence, `research/types.ts`'s `ResearchEvidence` |
| Claim | A `ResearchEvidence.claim` string, or a catalog fact before it is wrapped as evidence |
| Assumption | `AssumptionItem` (`types.ts`) + `CostOfDelayInput`/estimate `kind: "assumption"` provenance |
| Risk | `RiskItem` (`types.ts`) |
| Cost | `CostLineItem` (`engine/business-case/types.ts`, new) |
| Benefit | `BenefitLineItem` (`engine/business-case/types.ts`, new) |
| Scenario | `WeightOverrides` (strategic re-weighting, `engine/scenario.ts`) and `EconomicScenario` (financial, new) — two different scenario axes, deliberately not unified into one type (re-weighting criteria and re-reading a cost/benefit estimate are different operations with different inputs) |
| Stakeholder | CFO/CIO/EA/CISO lens — display-only weight presets (`ARCHITECTURE_LENS_OVERRIDES` and sibling presets), never a persisted role |
| Recommendation | `EngineResult.winner` / `ExecutiveRecommendation` (new) |
| Outcome | Not built this phase — see Known Limitations §P |

This is additive proof, not a claim: every "new" row above is new because the brief introduced
a genuinely new concern (money over time, adversarial challenge), not because an existing
concept was missing a type. Relational/jsonb Postgres, as already used throughout
`decision_versions.decision_input_json` / `deterministic_output_json`, remains sufficient —
see `docs/intelligence-fabric/ontology-v0.1.md` §6 for the same conclusion reached
independently for the public-site Enterprise Intelligence Graph.

## B. Business Case Engine

`apps/web/src/components/donna-ai/engine/business-case/`. Pure, deterministic functions —
no AI call computes a financial figure.

**Cost categories:** implementation, migration, subscriptionLicense, consumption,
infrastructure, operations, support, internalFte, externalServices, trainingSkills,
dataEgress, changeManagement.

**Benefit categories:** runCostReduction, productivityGain, timeToMarketImprovement,
infrastructureConsolidation, licenseConsolidation, automationBenefit, riskAvoidance,
revenueEnablement, costOfDelayAvoided.

Every line item (`CostLineItem`/`BenefitLineItem`) carries a `year`, a `FinancialEstimate`
(`{kind:"point", value}` or `{kind:"range", low, base, high}` — never only a single blended
number when the input was genuinely uncertain), and a `provenance: EvidenceType` — the same
six-type taxonomy used everywhere else in the product (`official-source | customer-input |
observed-data | calculated | ai-interpretation | assumption`). A financial input is never typed
as more certain than it was given.

**Horizons:** 1, 3, or 5 years, always reported as yearly cash flows
(`computeYearlyCashFlows`) — never collapsed to a single TCO number before the yearly detail
has been shown.

**Cost of Delay** (`computeCostOfDelay`) is deliberately computed separately from per-option
NPV: monthly delay cost, revenue opportunity delay, legacy run-cost extension, and
transformation delay cost are properties of *waiting*, which is roughly option-independent,
not properties of any one option's cash flow. It is never auto-assumed — `costOfDelay` is
`null` unless the user actually supplied it.

## C. Financial formulas

`calculations.ts`. All closed-form, hand-verified against manual discounting in
`__tests__/calculations.test.ts` (e.g. NPV at 10%: `-1000/1.1 + 500/1.1² + 600/1.1³ = -45.08`).

- **TCO** = sum of resolved cost line items across the horizon.
- **Total Benefits** = sum of resolved benefit line items across the horizon.
- **Net Benefit** = Total Benefits − TCO.
- **ROI%** = Net Benefit / TCO × 100, **`null` when TCO is 0** — never divided-by-zero-fabricated.
- **NPV** = standard discounted sum of yearly net cash flow at the given discount rate.
- **Payback (years)** = linear interpolation within the year cash flow first turns positive;
  `null` if it never does within the horizon — never extrapolated past the horizon the user
  asked for.

`INPUT` (what the user typed), `ASSUMPTION` (what the user accepted as an estimate), and
`CALCULATED` (TCO/ROI/NPV/payback, cash flows) are kept structurally distinct: calculated
fields have no corresponding input field anywhere in `BusinessCaseOptionInput` — they only
exist in `BusinessCaseOptionOutput`, which the input schema cannot produce.

## D. Economic scenarios

`ECONOMIC_SCENARIOS` (base/upside/downside) plus a custom multiplier map. The rule
(`resolveEstimate`): **upside and downside describe the outcome, not a literal reading** — a
cost's LOW estimate and a benefit's HIGH estimate are both read under UPSIDE (both favorable to
the business case); the reverse under DOWNSIDE. Applying a scenario never mutates the base
`BusinessCaseInput` the user entered — `computeBusinessCase` takes the scenario as a pure
argument and returns a new output every time.

## E. Financial sensitivity

`sensitivity.ts`, three deterministic reports, never AI-estimated:

- `identifyLargestDrivers` — categories ranked by total resolved dollar amount across the
  horizon.
- `identifyLargestUncertainty` — ranked only among `kind: "range"` line items by (high − low)
  spread; a point estimate, by definition, contributes no uncertainty and never appears here.
- `findRoiFlipMultiplier` — the exact multiplier on one category's value that would flip which
  of two options has the higher NPV. Solved in closed form (NPV is affine in any single line
  item's value holding everything else fixed — evaluate at the item removed and at its current
  value, then solve the resulting line for the crossing point) rather than by iterative search.

## F. Enterprise Context Model

`intelligence/types.ts`'s `EnterpriseContext` (new, additive, nullable, unpopulated by any UI
yet): `regulatoryRequirements`, `existingLicenses`, `strategicVendors`, `migrationDeadline`,
`operatingRegions`. Scoped deliberately narrow — goals, budget, risk appetite, preferred
cloud/vendor, and internal skills are already collected by the existing wizard
(`GoalsInput`/`ConstraintsInput`) and are **not** duplicated here. This is a typed destination
for a future connector (contract import, license registry, compliance questionnaire), not a
wizard redesign.

## G. Vendor Intelligence Graph

`vendor-intelligence/types.ts` adds `regionAvailability`, `consumptionModel`,
`operatingModel`, `skillsRequired`, and `evidenceReferences: VendorEvidenceReference[]` to
`VendorPlatformProfile`. Populated across all 10 existing catalog entries (`catalog.ts`) with
honest, conservative, publicly well-known facts only (e.g. `consumptionModel: "consumption-based"`
for Snowflake/Databricks/AWS/Google Cloud, matching their already-curated `pricingModel` text;
`regionAvailability: "limited"` for Oracle OCI and Palantir, reflecting their narrower public
region/delivery footprint relative to the three hyperscalers). **`evidenceReferences` is seeded
empty for every platform** — per the brief's own instruction, a capability without evidence is
UNKNOWN, and this catalog does not invent source URLs it never actually checked. Real
references are meant to be added by running Research Agent V1 against each platform's
documentation, not by backfilling this file.

## H. Challenger Agent V1

`engine/challenger/`. Attacks the current recommendation; cannot alter it.

**Deterministic challenges** (`deterministic-challenges.ts`, always run, need no AI):
`ALTERNATIVE_CHALLENGE` (from `engine/scenario.ts`'s pivotal-dimension search — what weight
shift flips the winner), `CONSTRAINT_CHALLENGE` (from UNKNOWN constraint evaluations on the
winner), `EVIDENCE_CHALLENGE` (missing critical evidence, or assumption ratio over 30% — the
same threshold `engine/confidence.ts` already uses), `FINANCIAL_CHALLENGE` (from
`findRoiFlipMultiplier` between the top two business-case options by NPV, when a business case
exists).

**AI-assisted challenges** (`openai-challenger-provider.ts`) are structurally restricted to the
3 types that need qualitative judgment rather than arithmetic: `ASSUMPTION_CHALLENGE`,
`ARCHITECTURE_CHALLENGE`, `RISK_CHALLENGE`. The other 4 types are not in the model's output
schema's enum at all — the model cannot produce a `FINANCIAL_CHALLENGE`, because
`aiChallengeSchema.strict()` has no value for it to use. Every `affectedOptionId` the model
names is checked against the real known option ids; a challenge naming a fabricated option is
dropped before it reaches the response.

**Statelessness:** challenges are computed fresh on every `POST /api/challenger/run`, never
persisted to a new table (§10 explains why — no new migration this phase). Re-running after
new evidence or a new business case naturally picks it up, since the handler always reads the
decision's *current* version. Documented limitation: no accept/dismiss persistence yet (§P).

## I. Executive Recommendation

`engine/executive-recommendation.ts`. Three lenses, never averaged or voted:

- **Strategic** = the base engine's own winner (`ranked[0]`) — the existing, unmodified score.
- **Architecture** = the winner under a fixed, documented weight override
  (`{architecture:0.25, technology:0.2, security:0.2, governance:0.15}`), computed by reusing
  `engine/scenario.ts`'s existing `runScenario` — no new scoring path.
- **Economic** = the business case option with the best NPV, mapped back to a real platform;
  `null` when no business case data exists — never guessed.
- **Overall** is always the strategic lens. `agree` is true only when every present lens names
  the same option; when they disagree, `disagreementNote` names every lens explicitly (the
  brief's own example: architecture favors one platform, economics another, strategy a third)
  rather than hiding the disagreement behind a single blended answer.

## J. Model Router — the same pattern, a third time

`IntelligenceProvider` (narrative enrichment), `ResearchProvider` (Research Agent V1), and
`ChallengerProvider` (this capability) share one shape: an `id`, a `model` string, and exactly
one async method that takes a typed context and returns a typed, validated result. None of
them couple the Decision Engine to a specific foundation model — `select-*-provider.ts` in
each domain picks a provider from config (`OPENAI_API_KEY` present → OpenAI-backed; absent →
an honest `{status:"disabled"}` deterministic fallback that still returns a usable, real
result). A fourth capability needing an AI call should reuse this exact shape rather than invent
a fourth abstraction layer — the pattern is proven stable across three independent domains now.

## K. Eval framework & vendor neutrality

`engine/__tests__/vendor-neutrality.test.ts` (new) constructs `WizardState` fixtures across
archetypal enterprise contexts (SAP-heavy, Microsoft-heavy, multi-cloud/cost-sensitive,
AI-first) and asserts catalog-order independence: shuffling `VENDOR_CATALOG`'s array order
before scoring never changes which platform wins for a fixed input, because scoring reads only
each platform's own fields, never its position in the array. A second fixture asserts that two
inputs differing only in which vendor happens to be named in `PreferredVendor` (with otherwise
identical capability requirements) do not silently reorder the ranking beyond what that
explicit preference constraint accounts for. This is a regression guard, not a claim of
statistical fairness — true bias testing needs real usage data this product does not have yet.

## L. Training data foundation (structure only — not training anything yet)

Every decision already has the shape a future training set needs, without a new table: decision
context (`decision_input_json`), options considered (`engineResult.alternatives`), evidence
(`EvidenceItem[]`, plus accepted/rejected research evidence once Research Agent V1 evidence is
reviewed), the human's final recommendation acceptance (`human_override_json`), and — once
Decision Memory's outcome tracking exists (not yet built) — the actual outcome. Private model
chain-of-thought is never persisted; only the validated, schema-checked output of any AI call
ever reaches a stored version.

## M. Future fine-tuning path (documented, not started)

1. Prompt + RAG + deterministic engine (today).
2. Build an eval dataset from real decisions and known-good/known-bad outputs (§K is the seed
   of this, not the finished thing).
3. Curate a synthetic + real corpus once enough real decisions exist.
4. Fine-tune an open-weight model against that corpus.
5. Distill/specialize per task (challenger vs. narrative vs. research claim extraction) only if
   a single fine-tune proves insufficiently precise for one of them.

The foundation model stays replaceable at every stage — §J's Model Router is what makes stage 4
possible without rewriting the Decision Engine.

## N. Decision Memory learning (conceptual extension, not built)

Future decisions could reuse accepted research evidence, validated assumptions, prior business
cases, and vendor capability facts verified for an earlier decision — scoped per tenant,
enforced the same way every other table in this product is (`is_org_member()` RLS), so a future
cross-decision learning feature can never read another tenant's evidence or financial inputs
even by a code bug — the access boundary is a database policy, not an application check.

## O. Marketing positioning (light touch, not a redesign)

Repositioning as **Enterprise Decision Intelligence** — Decision Intelligence, Evidence
Intelligence (Research Agent V1), Business Case Intelligence, Scenario Intelligence, Decision
Memory — is a copy-level change to existing surfaces, not a new product. Emphasis: vendor-
neutral, cross-platform, evidence-backed, economically modeled, deterministic where numbers
matter, AI-assisted where interpretation matters, human-governed, auditable. See the i18n diff
in this branch for the specific strings touched.

## P. Known limitations

- Challenger challenges have no accept/dismiss persistence (stateless by design this phase).
- Economic lens in Executive Recommendation requires the user to have entered business case
  inputs; absent that, it is honestly `null`, not estimated.
- `EnterpriseContext` and the Vendor Intelligence Graph's `evidenceReferences` are typed seams
  with no populating UI yet — intentional scope control, not an oversight.
- Vendor-neutrality tests are regression guards against *this codebase* reordering unfairly,
  not a statistical fairness audit against real-world outcome data.
- Outcome tracking (did the recommendation actually pay off) is not built — Decision Memory's
  `Outcome` entity (CDM §A) remains unimplemented.

## Q. Security review

- **Tenant isolation**: unchanged from Decision Memory's existing RLS boundary — business case
  and challenger data live inside the same `decision_versions` row, under the same policies.
  No new table, no new isolation surface to get wrong.
- **Financial data leakage**: business case inputs/outputs are stored, not logged; no new
  logging statement in this phase prints a financial figure.
- **Prompt injection**: the challenger's AI call follows the same layering as the research
  provider and the narrative enrichment provider — evidence/assumption/risk text is passed as
  labeled data, never concatenated into an instruction, and the whole response is
  `.strict()`-schema-validated before use.
- **Research evidence poisoning**: unchanged from Research Agent V1 — a challenge's
  `evidenceReferences` can only cite evidence ids that exist in the decision's own evidence
  package.
- **Model provider leakage**: the challenger provider never includes raw API keys, internal
  prompts, or provider error internals in its returned `reason` string on failure.
- **Sensitive contract information**: `EnterpriseContext.existingLicenses`/`strategicVendors`
  are plain strings with no schema path to a credential or contract document body.

---

See also: `docs/intelligence-fabric/ontology-v0.1.md` (the broader, public-site Enterprise
Intelligence Graph — a parallel but distinct model from this engine-level CDM), and
`docs/capabilities/decision-memory.md` (the underlying save/version capability this extends).
