import type { EmployeeBand, Industry, Trait } from "../types";

/** The three hyperscalers a company's `PreferredCloud` constraint can
 * name. Deliberately narrower than the full `CloudProvider` type (which
 * also has "multi-cloud" and "on-premise" — strategy descriptions of a
 * *customer*, not something a platform is "available on"). */
export type SupportedCloud = "azure" | "aws" | "gcp";

/** Vendor Intelligence Graph (brief §3) — region availability, kept
 * deliberately coarse. "global" means available on major public
 * cloud regions worldwide through the vendor's own hyperscaler
 * partnerships (a verifiable, well-known fact for a cloud-native
 * platform); "unknown" is the honest default for anything not
 * confidently a global offering — never a specific region list
 * invented without a real source to back it. */
export type RegionAvailability = "global" | "limited" | "unknown";

/** How the platform is actually bought, not how it's deployed
 * (CloudModel/DeploymentModel already cover that). Derived from the
 * vendor's own already-curated pricingModel/costCharacteristics text,
 * not a new fact. */
export type ConsumptionModel = "subscription" | "consumption-based" | "hybrid" | "unknown";

/** Who operates the platform day to day. */
export type OperatingModel = "fully-managed-saas" | "paas-self-operated" | "hybrid-managed" | "unknown";

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
  /** ISO date (YYYY-MM-DD). When this curated entry was last reviewed
   * — not a live data timestamp. This IS the "lastVerifiedAt" the
   * brief asks for (§3/§25); kept under its original name rather
   * than duplicated under a new one. */
  lastReviewedDate: string;

  /** Vendor Intelligence Graph additions (brief §3) — additive, never
   * backfilled with an invented fact. `evidenceReferences` starts
   * empty for every seeded platform and is meant to be filled in by
   * running the Research Agent against this platform's real
   * documentation, not by this catalog claiming a source it never
   * actually checked (brief §3: "never fabricate vendor capability
   * facts... a capability without evidence is UNKNOWN"). */
  regionAvailability: RegionAvailability;
  consumptionModel: ConsumptionModel;
  operatingModel: OperatingModel;
  /** Short, conservative list — populated only where the skill is
   * genuinely well-known and public (e.g. "ABAP" for SAP), empty
   * where not confidently known. Empty means "not yet assessed," not
   * "no skills required." */
  skillsRequired: string[];
  evidenceReferences: VendorEvidenceReference[];
}

export interface VendorEvidenceReference {
  url: string;
  title: string;
  /** What this reference is cited for, in plain language — e.g.
   * "AI capabilities overview." Not a claim about every fact in this
   * profile, only the specific thing it was added to support. */
  supports: string;
}
