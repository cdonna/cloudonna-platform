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
  FitCategory,
  GoalTag,
  Industry,
  InternalSkills,
  ItOrgSizeBand,
  PlatformProfile,
  PreferredCloud,
  PreferredVendor,
  RevenueBand,
  RiskAppetite,
  TimelineLevel,
  Trait,
  WizardState,
} from "./types";

export const INDUSTRY_OPTIONS: Array<{ value: Industry; label: string }> = [
  { value: "manufacturing", label: "Manufacturing" },
  { value: "financial-services", label: "Financial Services" },
  { value: "retail", label: "Retail" },
  { value: "healthcare", label: "Healthcare" },
  { value: "public-sector", label: "Public Sector" },
  { value: "technology", label: "Technology" },
];

export const COUNTRY_OPTIONS: Array<{ value: Country; label: string }> = [
  { value: "switzerland", label: "Switzerland" },
  { value: "germany", label: "Germany" },
  { value: "austria", label: "Austria" },
  { value: "uk", label: "United Kingdom" },
  { value: "france", label: "France" },
  { value: "united-states", label: "United States" },
  { value: "rest-of-europe", label: "Rest of Europe" },
  { value: "rest-of-world", label: "Rest of World" },
];

export const EMPLOYEE_OPTIONS: Array<{ value: EmployeeBand; label: string }> = [
  { value: "smb", label: "Under 500" },
  { value: "mid-market", label: "500–2,000" },
  { value: "enterprise", label: "2,000–10,000" },
  { value: "global-enterprise", label: "10,000+" },
];

export const REVENUE_OPTIONS: Array<{ value: RevenueBand; label: string }> = [
  { value: "under-100m", label: "Under CHF 100M" },
  { value: "100m-500m", label: "CHF 100M–500M" },
  { value: "500m-2b", label: "CHF 500M–2B" },
  { value: "over-2b", label: "CHF 2B+" },
];

export const IT_ORG_SIZE_OPTIONS: Array<{ value: ItOrgSizeBand; label: string }> = [
  { value: "small", label: "Small (<20 FTE)" },
  { value: "medium", label: "Medium (20–100 FTE)" },
  { value: "large", label: "Large (100–500 FTE)" },
  { value: "very-large", label: "Very large (500+ FTE)" },
];

export const ERP_OPTIONS: Array<{ value: ErpSystem; label: string }> = [
  { value: "sap-s4hana", label: "SAP S/4HANA" },
  { value: "sap-ecc", label: "SAP ECC (legacy)" },
  { value: "oracle", label: "Oracle" },
  { value: "dynamics", label: "Microsoft Dynamics" },
  { value: "other-none", label: "Other / None" },
];

export const CRM_OPTIONS: Array<{ value: CrmSystem; label: string }> = [
  { value: "salesforce", label: "Salesforce" },
  { value: "dynamics-crm", label: "Microsoft Dynamics CRM" },
  { value: "sap-crm", label: "SAP CRM" },
  { value: "other-none", label: "Other / None" },
];

export const ANALYTICS_OPTIONS: Array<{ value: AnalyticsTool; label: string }> = [
  { value: "power-bi", label: "Power BI" },
  { value: "sac", label: "SAP Analytics Cloud" },
  { value: "tableau", label: "Tableau" },
  { value: "looker", label: "Looker" },
  { value: "other-none", label: "Other / None" },
];

export const DATA_WAREHOUSE_OPTIONS: Array<{ value: DataWarehouseSystem; label: string }> = [
  { value: "sap-bw", label: "SAP BW" },
  { value: "snowflake", label: "Snowflake" },
  { value: "databricks", label: "Databricks" },
  { value: "bigquery", label: "Google BigQuery" },
  { value: "other-none", label: "Other / None" },
];

export const CLOUD_OPTIONS: Array<{ value: CloudProvider; label: string }> = [
  { value: "azure", label: "Microsoft Azure" },
  { value: "aws", label: "AWS" },
  { value: "gcp", label: "Google Cloud" },
  { value: "multi-cloud", label: "Multi-cloud" },
  { value: "on-premise", label: "On-premise only" },
];

export const AI_PLATFORM_OPTIONS: Array<{ value: AiPlatform; label: string }> = [
  { value: "none-yet", label: "None yet" },
  { value: "azure-ai", label: "Azure AI" },
  { value: "copilot", label: "Microsoft Copilot" },
  { value: "vertex-ai", label: "Google Vertex AI" },
  { value: "other", label: "Other" },
];

export const GOAL_OPTIONS: Array<{ value: GoalTag; label: string }> = [
  { value: "modernization", label: "Modernization" },
  { value: "business-ai", label: "Business AI" },
  { value: "planning", label: "Planning" },
  { value: "governance", label: "Governance" },
  { value: "data-products", label: "Data Products" },
  { value: "cost-reduction", label: "Cost Reduction" },
  { value: "compliance", label: "Compliance" },
  { value: "innovation", label: "Innovation" },
];

export const BUDGET_OPTIONS: Array<{ value: BudgetLevel; label: string }> = [
  { value: "tight", label: "Tight" },
  { value: "moderate", label: "Moderate" },
  { value: "flexible", label: "Flexible" },
];

export const TIMELINE_OPTIONS: Array<{ value: TimelineLevel; label: string }> = [
  { value: "aggressive", label: "Aggressive (<6 months)" },
  { value: "standard", label: "Standard (6–12 months)" },
  { value: "extended", label: "Extended (12+ months)" },
];

export const RISK_APPETITE_OPTIONS: Array<{ value: RiskAppetite; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const PREFERRED_CLOUD_OPTIONS: Array<{ value: PreferredCloud; label: string }> = [
  { value: "azure", label: "Azure" },
  { value: "aws", label: "AWS" },
  { value: "gcp", label: "GCP" },
  { value: "no-preference", label: "No preference" },
];

export const PREFERRED_VENDOR_OPTIONS: Array<{ value: PreferredVendor; label: string }> = [
  { value: "sap", label: "SAP" },
  { value: "microsoft", label: "Microsoft" },
  { value: "no-preference", label: "No preference" },
];

export const INTERNAL_SKILLS_OPTIONS: Array<{ value: InternalSkills; label: string }> = [
  { value: "strong", label: "Strong" },
  { value: "moderate", label: "Moderate" },
  { value: "limited", label: "Limited" },
];

export const FIT_CATEGORY_TRAITS: Record<FitCategory, Trait[]> = {
  architecture: ["sap-native", "governed-data", "modern-architecture", "multi-cloud"],
  business: ["enterprise-scale", "cost-efficient"],
  technology: ["ai-ready", "azure-aligned"],
};

export const FIT_CATEGORY_LABELS: Record<FitCategory, string> = {
  architecture: "Architecture fit",
  business: "Business fit",
  technology: "Technology fit",
};

export const PLATFORM_CATALOG: PlatformProfile[] = [
  {
    id: "sap-bdc",
    name: "SAP Business Data Cloud",
    tagline: "Governed data foundation for SAP-centric enterprises",
    traits: ["sap-native", "governed-data", "modern-architecture", "enterprise-scale", "ai-ready"],
  },
  {
    id: "ms-fabric",
    name: "Microsoft Fabric",
    tagline: "Unified analytics platform for Azure-aligned organizations",
    traits: ["azure-aligned", "modern-architecture", "enterprise-scale", "ai-ready"],
  },
  {
    id: "snowflake",
    name: "Snowflake",
    tagline: "Cloud-agnostic data platform with strong cost efficiency",
    traits: ["multi-cloud", "modern-architecture", "cost-efficient", "ai-ready"],
  },
  {
    id: "databricks",
    name: "Databricks",
    tagline: "Engineering-first lakehouse for advanced AI workloads",
    traits: ["multi-cloud", "modern-architecture", "ai-ready"],
  },
];

export const TRAIT_LABELS: Record<Trait, string> = {
  "sap-native": "SAP-native",
  "governed-data": "Governed data",
  "modern-architecture": "Modern architecture",
  "multi-cloud": "Multi-cloud",
  "enterprise-scale": "Enterprise scale",
  "cost-efficient": "Cost efficient",
  "ai-ready": "AI-ready",
  "azure-aligned": "Azure-aligned",
};

export const TRAIT_REASON_TEXT: Record<Trait, string> = {
  "sap-native": "Directly aligns with your existing SAP landscape — no disruptive platform switch required.",
  "governed-data": "Provides governed, semantic business data rather than raw, unmanaged pipelines.",
  "modern-architecture": "Supports your modernization goals with a current, well-supported architecture.",
  "multi-cloud": "Fits a multi-cloud strategy rather than locking you into a single vendor.",
  "enterprise-scale": "Proven at organizations of your scale.",
  "cost-efficient": "Favorable cost profile against your stated budget.",
  "ai-ready": "Built-in path to enable business AI on top of your data.",
  "azure-aligned": "Deep integration with your existing Microsoft Azure investment.",
};

export const GOAL_OPPORTUNITY_TEXT: Record<GoalTag, string> = {
  modernization: "A modernized foundation unlocks faster delivery of future initiatives.",
  "business-ai": "A governed data foundation is the prerequisite most business AI initiatives are blocked on today.",
  planning: "Structured, trusted data materially improves planning and forecasting accuracy.",
  governance: "Stronger governance reduces compliance risk and improves audit readiness.",
  "data-products": "Reusable data products cut duplicate integration work across future projects.",
  "cost-reduction": "Consolidating onto a governed platform typically reduces duplicate tooling spend.",
  compliance: "A single governed platform simplifies evidence collection for compliance audits.",
  innovation: "A modern, AI-ready foundation shortens the path from idea to working prototype.",
};

export const FALLBACK_OPPORTUNITIES: string[] = [
  "Early adoption within your industry peer group can be a competitive differentiator.",
  "A clear, evidence-based recommendation shortens internal alignment and procurement cycles.",
];

export const BUDGET_RISK_TEXT: Record<BudgetLevel, string | null> = {
  tight: "Commercial model and licensing tiers need careful scoping against a tight budget.",
  moderate: null,
  flexible: null,
};

export const TIMELINE_RISK_TEXT: Record<TimelineLevel, string | null> = {
  aggressive: "An aggressive timeline increases delivery risk — a phased rollout is worth considering.",
  standard: null,
  extended: null,
};

export const SKILLS_RISK_TEXT: Record<InternalSkills, string | null> = {
  limited: "Implementation will likely require external expertise given limited internal capacity.",
  moderate: null,
  strong: null,
};

export const VENDOR_RISK_TEXT: Record<PreferredVendor, string | null> = {
  sap: "Concentrating on a single vendor increases commercial dependency over time.",
  microsoft: null,
  "no-preference": null,
};

export const FALLBACK_RISKS: string[] = [
  "Underlying licensing and support terms should be confirmed directly with the vendor.",
  "This preview does not account for existing contractual commitments.",
];

export const BASE_ASSUMPTIONS: string[] = [
  "Assumes standard commercial terms; existing licensing agreements were not modeled.",
  "Assumes a typical evaluation and procurement timeline of three to six months.",
];

export const WORKSHOP_LIBRARY: Array<{ id: string; title: string; description: string }> = [
  {
    id: "architecture-deep-dive",
    title: "Architecture Deep-Dive Workshop",
    description: "A half-day session to validate the target architecture against your existing landscape in detail.",
  },
  {
    id: "governance-readiness",
    title: "Data Governance Readiness Workshop",
    description: "Assess current governance maturity and define ownership before rollout.",
  },
  {
    id: "ai-readiness",
    title: "Business AI Readiness Workshop",
    description: "Identify the highest-value AI use cases your data foundation could support first.",
  },
  {
    id: "tco-validation",
    title: "TCO Validation Workshop",
    description: "Work through commercial terms and a three-year cost model with procurement and finance.",
  },
  {
    id: "migration-planning",
    title: "Migration Planning Workshop",
    description: "Sequence a phased migration plan that respects your timeline and internal capacity.",
  },
];

export const SAMPLE_PROFILE: WizardState = {
  stepIndex: 0,
  company: {
    industry: "manufacturing",
    country: "switzerland",
    employees: "enterprise",
    revenue: "500m-2b",
    itOrgSize: "medium",
    note: "European industrial equipment manufacturer, roughly 4,000 employees.",
  },
  landscape: {
    erp: "sap-s4hana",
    crm: "salesforce",
    analytics: "power-bi",
    dataWarehouse: "sap-bw",
    cloud: "azure",
    aiPlatform: "none-yet",
    note: "Core ERP on SAP S/4HANA; reporting currently on Power BI via Azure.",
  },
  goals: {
    goals: ["modernization", "business-ai", "governance"],
    note: "The board wants a modern data foundation to support AI-driven maintenance forecasting within 12 months.",
  },
  constraints: {
    budget: "moderate",
    timeline: "aggressive",
    riskAppetite: "low",
    preferredCloud: "azure",
    preferredVendor: "sap",
    internalSkills: "moderate",
    note: "IT leadership has mandated that core financials remain SAP-native.",
  },
};

export const EMPTY_WIZARD_STATE: WizardState = {
  stepIndex: 0,
  company: {
    industry: null,
    country: null,
    employees: null,
    revenue: null,
    itOrgSize: null,
    note: "",
  },
  landscape: {
    erp: null,
    crm: null,
    analytics: null,
    dataWarehouse: null,
    cloud: null,
    aiPlatform: null,
    note: "",
  },
  goals: { goals: [], note: "" },
  constraints: {
    budget: null,
    timeline: null,
    riskAppetite: null,
    preferredCloud: null,
    preferredVendor: null,
    internalSkills: null,
    note: "",
  },
};
