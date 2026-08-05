export type Industry =
  | "manufacturing"
  | "financial-services"
  | "retail"
  | "healthcare"
  | "public-sector"
  | "technology";

export type Country =
  | "switzerland"
  | "germany"
  | "austria"
  | "uk"
  | "france"
  | "united-states"
  | "rest-of-europe"
  | "rest-of-world";

export type EmployeeBand = "smb" | "mid-market" | "enterprise" | "global-enterprise";
export type RevenueBand = "under-100m" | "100m-500m" | "500m-2b" | "over-2b";
export type ItOrgSizeBand = "small" | "medium" | "large" | "very-large";

export type ErpSystem = "sap-s4hana" | "sap-ecc" | "oracle" | "dynamics" | "other-none";
export type CrmSystem = "salesforce" | "dynamics-crm" | "sap-crm" | "other-none";
export type AnalyticsTool = "power-bi" | "sac" | "tableau" | "looker" | "other-none";
export type DataWarehouseSystem = "sap-bw" | "snowflake" | "databricks" | "bigquery" | "other-none";
export type CloudProvider = "azure" | "aws" | "gcp" | "multi-cloud" | "on-premise";
export type AiPlatform = "none-yet" | "azure-ai" | "copilot" | "vertex-ai" | "other";

export type GoalTag =
  | "modernization"
  | "business-ai"
  | "planning"
  | "governance"
  | "data-products"
  | "cost-reduction"
  | "compliance"
  | "innovation";

export type BudgetLevel = "tight" | "moderate" | "flexible";
export type TimelineLevel = "aggressive" | "standard" | "extended";
export type RiskAppetite = "low" | "medium" | "high";
export type PreferredCloud = "azure" | "aws" | "gcp" | "no-preference";
export type PreferredVendor = "sap" | "microsoft" | "no-preference";
export type InternalSkills = "strong" | "moderate" | "limited";

export type Trait =
  | "sap-native"
  | "governed-data"
  | "modern-architecture"
  | "multi-cloud"
  | "enterprise-scale"
  | "cost-efficient"
  | "ai-ready"
  | "azure-aligned";

export type FitCategory = "architecture" | "business" | "technology";

export interface CompanyInput {
  industry: Industry | null;
  country: Country | null;
  employees: EmployeeBand | null;
  revenue: RevenueBand | null;
  itOrgSize: ItOrgSizeBand | null;
  note: string;
}

export interface LandscapeInput {
  erp: ErpSystem | null;
  crm: CrmSystem | null;
  analytics: AnalyticsTool | null;
  dataWarehouse: DataWarehouseSystem | null;
  cloud: CloudProvider | null;
  aiPlatform: AiPlatform | null;
  note: string;
}

export interface GoalsInput {
  goals: GoalTag[];
  note: string;
}

export interface ConstraintsInput {
  budget: BudgetLevel | null;
  timeline: TimelineLevel | null;
  riskAppetite: RiskAppetite | null;
  preferredCloud: PreferredCloud | null;
  preferredVendor: PreferredVendor | null;
  internalSkills: InternalSkills | null;
  note: string;
}

export type StepKey = "company" | "landscape" | "goals" | "constraints";

export const WIZARD_STEP_ORDER: readonly StepKey[] = [
  "company",
  "landscape",
  "goals",
  "constraints",
] as const;

/** Step indices: 0-3 = data steps, 4 = review, 5 = analysis (automatic). */
export const REVIEW_STEP_INDEX = 4;
export const ANALYSIS_STEP_INDEX = 5;
export const TOTAL_WIZARD_STEPS = 6;

export interface WizardState {
  stepIndex: number;
  company: CompanyInput;
  landscape: LandscapeInput;
  goals: GoalsInput;
  constraints: ConstraintsInput;
}

export type WizardAction =
  | { type: "SET_COMPANY_FIELD"; field: "industry"; value: Industry }
  | { type: "SET_COMPANY_FIELD"; field: "country"; value: Country }
  | { type: "SET_COMPANY_FIELD"; field: "employees"; value: EmployeeBand }
  | { type: "SET_COMPANY_FIELD"; field: "revenue"; value: RevenueBand }
  | { type: "SET_COMPANY_FIELD"; field: "itOrgSize"; value: ItOrgSizeBand }
  | { type: "SET_LANDSCAPE_FIELD"; field: "erp"; value: ErpSystem }
  | { type: "SET_LANDSCAPE_FIELD"; field: "crm"; value: CrmSystem }
  | { type: "SET_LANDSCAPE_FIELD"; field: "analytics"; value: AnalyticsTool }
  | { type: "SET_LANDSCAPE_FIELD"; field: "dataWarehouse"; value: DataWarehouseSystem }
  | { type: "SET_LANDSCAPE_FIELD"; field: "cloud"; value: CloudProvider }
  | { type: "SET_LANDSCAPE_FIELD"; field: "aiPlatform"; value: AiPlatform }
  | { type: "TOGGLE_GOAL"; value: GoalTag }
  | { type: "SET_CONSTRAINT_FIELD"; field: "budget"; value: BudgetLevel }
  | { type: "SET_CONSTRAINT_FIELD"; field: "timeline"; value: TimelineLevel }
  | { type: "SET_CONSTRAINT_FIELD"; field: "riskAppetite"; value: RiskAppetite }
  | { type: "SET_CONSTRAINT_FIELD"; field: "preferredCloud"; value: PreferredCloud }
  | { type: "SET_CONSTRAINT_FIELD"; field: "preferredVendor"; value: PreferredVendor }
  | { type: "SET_CONSTRAINT_FIELD"; field: "internalSkills"; value: InternalSkills }
  | { type: "SET_NOTE"; step: StepKey; value: string }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "GOTO_STEP"; index: number }
  | { type: "LOAD_SAMPLE" }
  | { type: "RESET" };

export interface PlatformProfile {
  id: string;
  name: string;
  tagline: string;
  traits: Trait[];
}

export interface RankedPlatform {
  platform: PlatformProfile;
  score: number;
  matchedTraits: Trait[];
}

export interface FitBreakdown {
  category: FitCategory;
  label: string;
  score: number;
}

export interface ReasonItem {
  trait: Trait;
  text: string;
}

export interface RiskItem {
  text: string;
}

export interface OpportunityItem {
  text: string;
}

export interface AssumptionItem {
  text: string;
}

export interface NextStepItem {
  text: string;
  horizon: "now" | "next" | "later";
}

export interface WorkshopItem {
  title: string;
  description: string;
}

export interface DecisionOutput {
  recommendation: RankedPlatform;
  alternativeRecommendation: RankedPlatform | null;
  alternatives: RankedPlatform[];
  donnaScore: number;
  confidenceScore: number;
  fitBreakdown: FitBreakdown[];
  executiveSummary: string;
  reasons: ReasonItem[];
  risks: RiskItem[];
  opportunities: OpportunityItem[];
  assumptions: AssumptionItem[];
  nextSteps: NextStepItem[];
  workshops: WorkshopItem[];
}
