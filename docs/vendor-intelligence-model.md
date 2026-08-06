# Vendor Intelligence Model

**Module:** `apps/web/src/components/donna-ai/vendor-intelligence/`
**Status:** Expanded in Sprint 3B into an enterprise-grade knowledge base — ~30 structured
fields per platform, up from the ~14-field Sprint 3 baseline.

## What this is

A structured, 10-platform catalog (`catalog.ts`) typed against `VendorPlatformProfile`
(`types.ts`). It is the single source of truth the Donna Score v2 scoring engine reads from —
nothing about a platform is hard-coded anywhere else.

**This is curated mock data, not live market data.** Every catalog entry carries its own
`sourceNotes` field stating exactly that, plus a `lastReviewedDate`. No entry claims official
vendor certification, market share, benchmark results, or live pricing (no
Gartner/Forrester/IDC data was used or referenced). Every quantitative-sounding characteristic
in the catalog is a qualitative `MaturityBand`, never a number.

## The catalog

| Platform | Structural Category | Vendor Category (curated label) |
|---|---|---|
| SAP Business Data Cloud | Data platform | Governed Business Data Foundation |
| Snowflake | Data platform | Cloud-Agnostic Data Warehouse |
| Databricks | Data platform | AI-Native Lakehouse Platform |
| Microsoft Fabric | Data platform | Unified Analytics Platform |
| Oracle (OCI / Autonomous Database) | Enterprise legacy | Enterprise Database & Applications Vendor |
| AWS | Hyperscale cloud | Hyperscale Cloud Infrastructure Provider |
| Google Cloud | Hyperscale cloud | Hyperscale Cloud Infrastructure Provider |
| Palantir (Foundry / AIP) | Decision & ops intelligence | Ontology-Based Decision Intelligence Platform |
| IBM (Cloud / Db2 / watsonx) | Enterprise legacy | Legacy Enterprise Technology Vendor |
| MongoDB (Atlas) | Operational database | Operational Document Database |

### `category` vs. `vendorCategory` — two different jobs

`category: PlatformCategory` is the small, fixed, 5-value structural grouping the UI relies on
programmatically — it's what `hasCrossCategoryComparison` in `AlternativesTab`/`ComparisonMatrix`
checks to warn when a comparison spans fundamentally different problem spaces (an operational
database vs. an analytical data platform, for example).

`vendorCategory: string` (new in Sprint 3B) is a curated, free-text positioning label for
*display* — more specific and more readable than the structural category, but not something any
logic branches on. Keeping these separate means the UI's category-mismatch warning stays
reliable (fixed vocabulary) while the display copy can stay precise and specific per platform.

## Field model

`VendorPlatformProfile` (full definition in `types.ts`) now groups into:

- **Identity**: `id`, `vendor`, `productName`, `category`, `vendorCategory`, `shortDescription`
- **Executive narrative** (new in 3B): `executivePositioning` (one-sentence C-level pitch),
  `idealCustomerProfile`, `executiveSummary` (2–4 sentence board-room synthesis)
- **Fit narrative**: `idealUseCases`, `antiPatterns`, `typicalStrengths`, `typicalWeaknesses`,
  `migrationScenarios` (new — realistic "migrating from X" scenarios)
- **Architecture**: `architectureCharacteristics`, `cloudModel`, `deploymentModels` (now an
  array — a platform can support more than one deployment model)
- **Qualitative maturity bands** (`MaturityBand`: emerging / developing / established / leading):
  - Governance & trust: `governance`, `security`, `compliance` (new)
  - AI: `aiCapabilities`, `machineLearning` (new), `generativeAi` (new)
  - Ecosystem: `ecosystemStrength`, `partnerNetwork`
  - Integration depth (all new): `sapIntegration`, `erpIntegration`, `crmIntegration`,
    `dataWarehouseIntegration`, `multiCloudSupport`
  - Data platform capability (all new): `lakehouseCapabilities`, `dataVirtualization`,
    `dataSharing`, `metadataManagement`, `masterDataManagement`, `streaming`
- **Delivery characteristics**: `implementationComplexity`, `timeToValue`, `vendorLockInRisk`
- **Commercial**: `pricingModel` (free text), `costTier`, `costCharacteristics` (new — a
  narrative on how costs actually behave, e.g. consumption creep risk, not just a single band)
- **Applicability**: `industryFit`, `companySizeFit`, `integrationStrengths`
- **Scoring hook**: `traits` (see below)
- **Provenance**: `sourceNotes`, `lastReviewedDate`

### Renamed from Sprint 3 (same meaning, aligned terminology)

| Sprint 3 | Sprint 3B |
|---|---|
| `bestFitScenarios` | `idealUseCases` |
| `poorFitScenarios` | `antiPatterns` |
| `strengths` | `typicalStrengths` |
| `limitations` | `typicalWeaknesses` |
| `supportedIndustries` | `industryFit` |
| `supportedCompanySizes` | `companySizeFit` |
| `governanceCapability` | `governance` |
| `aiReadiness` | `aiCapabilities` |
| `securityPosture` | `security` |
| `deploymentModel` (single) | `deploymentModels` (array) |

These are mechanical renames for terminology consistency with the requested field list — not
logic changes. `scoring/engine.ts`'s three call sites that read the renamed fields
(`businessFit`, `governanceFit`, `aiReadinessFit`/`technologyFit`, `securityFit`) were updated to
match; the scoring formulas and weights themselves are untouched. Note: the scoring dimension
*output* key `"aiReadiness"` (in `ScoreDimensionKey`/`SCORE_DIMENSION_LABELS`) is a different,
unrelated concept from the catalog's `aiReadiness` → `aiCapabilities` field rename — the output
dimension name was deliberately left alone.

### Why maturity bands are qualitative, not numbers

`MaturityBand` is deliberately a four-value enum, not a 0–100 score, across all ~20 banded
fields — including the 12 new ones added in 3B. These are curated editorial judgments about a
platform's general positioning. Putting a number on "Generative AI: leading" would imply a
precision that doesn't exist in curated mock data, and could easily be misread as a real
benchmark result. **Numeric scores only ever come from the scoring engine**
(`scoring/engine.ts`), which is transparent about exactly how each number is derived. See
`docs/donna-score-v2.md`.

## What the scoring engine consumes today vs. later

As of Sprint 3B, `scoring/engine.ts`'s ten dimensions still read the same subset of fields they
read in Sprint 3 (`governance`, `aiCapabilities`, `security`, `ecosystemStrength`,
`partnerNetwork`, `costTier`, `timeToValue`, `industryFit`, `companySizeFit`, plus `traits`).
**The 12 new integration/capability bands (`sapIntegration`, `erpIntegration`, `crmIntegration`,
`dataWarehouseIntegration`, `multiCloudSupport`, `machineLearning`, `generativeAi`, `compliance`,
`lakehouseCapabilities`, `dataVirtualization`, `dataSharing`, `metadataManagement`,
`masterDataManagement`, `streaming`) are not yet read by any scoring formula.** They exist so a
future scoring refinement can consume them — per this sprint's explicit scope, that consumption
is deliberately deferred, not built now.

## Traits — the architecture-scoring hook

`Trait` (defined in the top-level `types.ts`, shared with the wizard) is a flat set of signals
used specifically to compute the Architecture Fit dimension via overlap with what the wizard's
`activateTraits()` function derives from the user's landscape/goals/constraints. Unchanged in
3B: `sap-native`, `governed-data`, `modern-architecture`, `multi-cloud`, `enterprise-scale`,
`cost-efficient`, `ai-ready`, `azure-aligned`, `aws-aligned`, `gcp-aligned`, `hyperscale-infra`,
`operational-workload`, `high-touch-enterprise`, `legacy-integration`, `vendor-neutral`.

## Known limitations

- 10 platforms, hand-curated. This is an explainable mock catalog for a Public Alpha, not a
  procurement-grade market evaluation.
- Some product names (Oracle, IBM) intentionally span multiple real product lines — the
  `shortDescription`, `executivePositioning`, and `typicalWeaknesses` fields call this out
  rather than picking one arbitrarily.
- `lastReviewedDate` reflects when the curated entry was last edited, not a live data refresh.
- The 12 newly-added integration/capability bands are populated and internally consistent with
  each platform's narrative fields, but are not yet load-bearing for any score — see "What the
  scoring engine consumes today vs. later" above.
