import type {
  AiPlatform,
  AnalyticsTool,
  BudgetLevel,
  CloudProvider,
  Country,
  CrmSystem,
  DataWarehouseSystem,
  EmployeeBand,
  ErpSystem,
  GoalTag,
  Industry,
  InternalSkills,
  PreferredCloud,
  PreferredVendor,
  RiskAppetite,
  TimelineLevel,
} from "../types";

/**
 * Where a field's value came from — surfaced directly in the
 * confirmation screen (see UnderstandingConfirmation.tsx) so "User
 * said" and "Donna inferred" are never visually or semantically
 * conflated. "default" is reserved for values that would need to come
 * from somewhere other than the user's own statement or a derived
 * inference (not currently produced by the deterministic extractor —
 * kept in the type so a future provider can express it honestly rather
 * than overloading "inferred").
 */
export type ExtractionSource = "user_statement" | "inferred" | "default";

/**
 * The one shape every extracted value takes, regardless of field or
 * provider. `confidence` is 0..1. `requiresConfirmation` is a decision,
 * not just a display of confidence — see CONFIRMATION_THRESHOLD in
 * deterministic-extractor.ts for where that line is drawn.
 */
export interface ExtractedField<T> {
  value: T;
  confidence: number;
  source: ExtractionSource;
  requiresConfirmation: boolean;
  /** The user's own words for this fact, when they're more precise than
   * the normalized `value` — e.g. "around 4,000" for a value that's
   * been banded to "2,000–10,000" for scoring. Never invented: only
   * set when the extractor actually captured a more specific fragment
   * than the normalized band it had to reduce it to. The UI must show
   * this alongside the band, never silently replace one with the
   * other — see the Founder report's "HIGH-FIDELITY INPUT MODEL". */
  rawText?: string;
}

/**
 * One candidate per closed-vocabulary WizardState field this extractor
 * knows how to fill. Field names deliberately match CompanyInput /
 * LandscapeInput / ConstraintsInput keys one-to-one, so merging a
 * confirmed candidate into WizardState via the existing wizardReducer
 * actions (SET_COMPANY_FIELD / SET_LANDSCAPE_FIELD / SET_CONSTRAINT_FIELD)
 * is a direct, typed mapping — see apply-candidates.ts.
 */
export interface ExtractionCandidates {
  industry?: ExtractedField<Industry>;
  country?: ExtractedField<Country>;
  employees?: ExtractedField<EmployeeBand>;
  erp?: ExtractedField<ErpSystem>;
  crm?: ExtractedField<CrmSystem>;
  analytics?: ExtractedField<AnalyticsTool>;
  dataWarehouse?: ExtractedField<DataWarehouseSystem>;
  cloud?: ExtractedField<CloudProvider>;
  aiPlatform?: ExtractedField<AiPlatform>;
  budget?: ExtractedField<BudgetLevel>;
  timeline?: ExtractedField<TimelineLevel>;
  riskAppetite?: ExtractedField<RiskAppetite>;
  preferredCloud?: ExtractedField<PreferredCloud>;
  preferredVendor?: ExtractedField<PreferredVendor>;
  internalSkills?: ExtractedField<InternalSkills>;
}

export type ExtractionFieldKey = keyof ExtractionCandidates;

/** The landscape categories WizardState only has one scored slot for —
 * erp, dataWarehouse, analytics, cloud, crm, aiPlatform are all
 * single-value fields, but a real enterprise statement can name more
 * than one system per category (e.g. "SAP BW, Power BI and Snowflake").
 * `candidates[category]` keeps carrying the first/primary match, exactly
 * as before, so scoring is completely unaffected; every match beyond
 * the first is captured here instead of silently discarded, so it can
 * still be shown to the user and never re-asked about. This is
 * deliberately NOT a new scored field — see the Founder report's
 * "MULTI-SYSTEM LANDSCAPE FIX" for why a full multi-value scoring model
 * was ruled out as more than this fix needs. */
export type LandscapeCategory = "erp" | "crm" | "analytics" | "dataWarehouse" | "cloud" | "aiPlatform";

export interface AdditionalSystem {
  category: LandscapeCategory;
  label: string;
  value: string;
}

/**
 * Goals are multi-select on WizardState, so they get their own list
 * instead of a single ExtractedField — each tag earns its confidence
 * independently rather than one confidence standing in for a whole set.
 */
export interface ExtractionResult {
  statement: string;
  candidates: ExtractionCandidates;
  goals: ExtractedField<GoalTag>[];
  additionalSystems: AdditionalSystem[];
}
