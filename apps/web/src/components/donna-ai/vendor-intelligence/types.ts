import type { EmployeeBand, Industry, Trait } from "../types";

/** The three hyperscalers a company's `PreferredCloud` constraint can
 * name. Deliberately narrower than the full `CloudProvider` type (which
 * also has "multi-cloud" and "on-premise" — strategy descriptions of a
 * *customer*, not something a platform is "available on"). */
export type SupportedCloud = "azure" | "aws" | "gcp";

/**
 * Broad structural category. NOT interchangeable substitutes for one
 * another — exists specifically so the UI can flag when a comparison spans
 * categories (e.g. an operational database vs. an analytical data platform)
 * rather than implying false equivalence. Distinct from `vendorCategory`
 * below, which is a curated, specific positioning label for display.
 */
export type PlatformCategory =
  | "data-platform"
  | "hyperscale-cloud"
  | "operational-database"
  | "enterprise-legacy"
  | "decision-ops-intelligence";

export type CloudModel = "single-cloud" | "multi-cloud" | "hybrid" | "on-premise-capable";
export type DeploymentModel = "saas" | "paas" | "iaas" | "managed-service" | "self-hosted";
export type CostTier = "entry" | "mid" | "premium" | "enterprise-custom";
export type ImplementationComplexity = "low" | "medium" | "high" | "very-high";
export type TimeToValueBand = "weeks" | "1-3-months" | "3-6-months" | "6-plus-months";
export type LockInRisk = "low" | "medium" | "high" | "very-high";

/**
 * Qualitative maturity band for descriptive catalog fields. Deliberately
 * NOT a number — these are curated editorial judgments, not measurements,
 * not market share, not benchmark results, and not live pricing. Numeric
 * scores only ever come from the scoring engine (scoring/engine.ts), which
 * is transparent about how its numbers are derived from these bands plus
 * the user's actual inputs.
 */
export type MaturityBand = "emerging" | "developing" | "established" | "leading";

export interface VendorPlatformProfile {
  id: string;
  vendor: string;
  productName: string;
  category: PlatformCategory;
  /** Curated, specific positioning label for display — e.g. "Unified Analytics & AI Platform". Not a scoring input. */
  vendorCategory: string;
  shortDescription: string;
  /** One sentence, C-level pitch — distinct from shortDescription (catalog-card length) and executiveSummary (board-room paragraph). */
  executivePositioning: string;
  /** Who this platform is actually built for — narrative, not a bullet list. */
  idealCustomerProfile: string;
  /** 2-4 sentence board-room-ready synthesis: category, fit, key differentiator, primary caveat. */
  executiveSummary: string;

  idealUseCases: string[];
  antiPatterns: string[];
  typicalStrengths: string[];
  typicalWeaknesses: string[];
  /** Realistic "migrating from X to this platform" scenarios — distinct from idealUseCases, specifically about transition paths. */
  migrationScenarios: string[];

  architectureCharacteristics: string[];
  cloudModel: CloudModel;
  deploymentModels: DeploymentModel[];

  /** Which hyperscaler clouds this platform is genuinely available on
   * today — never a market-share or preference claim, only "does it run
   * there." Feeds the Constraint Engine's "must support cloud X" hard
   * constraint (engine/constraints.ts); "multi-cloud" company inputs
   * never need to match this, since a multi-cloud shop has no specific
   * cloud requirement to violate. */
  supportedClouds: SupportedCloud[];

  governance: MaturityBand;
  security: MaturityBand;
  compliance: MaturityBand;
  aiCapabilities: MaturityBand;
  machineLearning: MaturityBand;
  generativeAi: MaturityBand;
  ecosystemStrength: MaturityBand;
  partnerNetwork: MaturityBand;

  sapIntegration: MaturityBand;
  erpIntegration: MaturityBand;
  crmIntegration: MaturityBand;
  dataWarehouseIntegration: MaturityBand;
  multiCloudSupport: MaturityBand;
  lakehouseCapabilities: MaturityBand;
  dataVirtualization: MaturityBand;
  dataSharing: MaturityBand;
  metadataManagement: MaturityBand;
  masterDataManagement: MaturityBand;
  streaming: MaturityBand;

  implementationComplexity: ImplementationComplexity;
  timeToValue: TimeToValueBand;
  vendorLockInRisk: LockInRisk;

  pricingModel: string;
  costTier: CostTier;
  /** Narrative on how costs actually behave (e.g. consumption creep risk) — richer than costTier's single band. */
  costCharacteristics: string;

  industryFit: Industry[];
  companySizeFit: EmployeeBand[];
  integrationStrengths: string[];

  /** Traits feed the deterministic Architecture Fit dimension (scoring/engine.ts). */
  traits: Trait[];

  sourceNotes: string;
  /** ISO date (YYYY-MM-DD). When this curated entry was last reviewed — not a live data timestamp. */
  lastReviewedDate: string;
}
