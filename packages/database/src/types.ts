/**
 * Row shapes for the tables defined in supabase/migrations/. Hand-authored
 * for the same reason enums.ts is — see that file's header comment. Column
 * names and nullability are copied directly from the migrations; if the two
 * drift, the migration is the source of truth.
 */
import type {
  AiMessageRole,
  CloudModel,
  ConstraintType,
  CostTier,
  DecisionSessionStatus,
  DeploymentModel,
  EmployeeBand,
  EvidenceReliabilityTier,
  GoalTag,
  ImplementationComplexity,
  LockInRisk,
  MaturityBand,
  OrganizationMemberRole,
  PlatformCategory,
  ScoreDimensionKey,
  TimeToValueBand,
  Trait,
  VerificationStatus,
} from "./enums";

/** created_at/updated_at/created_by, present on every mutable table. */
export interface AuditedRow {
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

/** AuditedRow plus deleted_at, present on every soft-deletable table. See
 * docs/platform/database-architecture.md, "Soft deletes: where they do and
 * don't apply" for the tables that deliberately omit this. */
export interface SoftDeletableRow extends AuditedRow {
  deleted_at: string | null;
}

// ---------------------------------------------------------------------------
// Tenancy

export interface Organization extends SoftDeletableRow {
  id: string;
  name: string;
  slug: string;
}

export interface User extends SoftDeletableRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface OrganizationMember extends SoftDeletableRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  invited_by: string | null;
  joined_at: string;
}

export interface Workspace extends SoftDeletableRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Project extends SoftDeletableRow {
  id: string;
  organization_id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_archived: boolean;
}

// ---------------------------------------------------------------------------
// Shared taxonomy (global reference data)

export interface VendorCategory extends SoftDeletableRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Industry extends SoftDeletableRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface UseCase extends SoftDeletableRow {
  id: string;
  industry_id: string | null;
  name: string;
  slug: string;
  description: string | null;
}

export interface ArchitecturePattern extends SoftDeletableRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface TechnologyPattern extends SoftDeletableRow {
  id: string;
  architecture_pattern_id: string | null;
  name: string;
  slug: string;
  description: string | null;
}

export interface Capability extends SoftDeletableRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

// ---------------------------------------------------------------------------
// Vendor catalog (global reference data)

export interface Vendor extends SoftDeletableRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  founded_year: number | null;
  headquarters_country: string | null;
  website_url: string | null;
  logo_url: string | null;
}

export interface Product extends SoftDeletableRow {
  id: string;
  vendor_id: string;
  vendor_category_id: string | null;
  platform_category: PlatformCategory;
  name: string;
  slug: string;

  short_description: string | null;
  executive_positioning: string | null;
  ideal_customer_profile: string | null;
  executive_summary: string | null;

  ideal_use_cases: string[];
  anti_patterns: string[];
  typical_strengths: string[];
  typical_weaknesses: string[];
  migration_scenarios: string[];
  architecture_characteristics: string[];

  cloud_model: CloudModel;
  deployment_models: DeploymentModel[];

  governance: MaturityBand | null;
  security: MaturityBand | null;
  compliance: MaturityBand | null;
  ai_capabilities: MaturityBand | null;
  machine_learning: MaturityBand | null;
  generative_ai: MaturityBand | null;
  ecosystem_strength: MaturityBand | null;
  partner_network: MaturityBand | null;
  sap_integration: MaturityBand | null;
  erp_integration: MaturityBand | null;
  crm_integration: MaturityBand | null;
  data_warehouse_integration: MaturityBand | null;
  multi_cloud_support: MaturityBand | null;
  lakehouse_capabilities: MaturityBand | null;
  data_virtualization: MaturityBand | null;
  data_sharing: MaturityBand | null;
  metadata_management: MaturityBand | null;
  master_data_management: MaturityBand | null;
  streaming: MaturityBand | null;

  implementation_complexity: ImplementationComplexity | null;
  time_to_value: TimeToValueBand | null;
  vendor_lock_in_risk: LockInRisk | null;

  pricing_model: string | null;
  cost_tier: CostTier | null;
  cost_characteristics: string | null;

  company_size_fit: EmployeeBand[];
  integration_strengths: string[];
  traits: Trait[];

  source_notes: string | null;
  last_reviewed_date: string | null;

  /** null until a future ingestion job populates it. See docs, "AI-readiness". */
  embedding: number[] | null;
}

export interface ProductIndustry {
  product_id: string;
  industry_id: string;
  created_at: string;
}

export interface ProductCapability extends SoftDeletableRow {
  id: string;
  product_id: string;
  capability_id: string;
  maturity_band: MaturityBand;
  notes: string | null;
}

export interface AnalystReport extends SoftDeletableRow {
  id: string;
  title: string;
  publisher: string;
  published_at: string | null;
  url: string | null;
  summary: string | null;
  embedding: number[] | null;
}

export interface CustomerReference extends SoftDeletableRow {
  id: string;
  product_id: string;
  industry_id: string | null;
  use_case_id: string | null;
  company_name: string | null;
  is_public: boolean;
  summary: string | null;
  source_url: string | null;
}

// ---------------------------------------------------------------------------
// Partner ecosystem (global reference data)

export interface PartnerCompany extends SoftDeletableRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  regions: string[];
  specialties: string[];
  verification_status: VerificationStatus;
}

export interface ImplementationPartner extends SoftDeletableRow {
  id: string;
  partner_company_id: string;
  product_id: string;
  certification_level: string | null;
  verification_status: VerificationStatus;
}

// ---------------------------------------------------------------------------
// Decision engine core (tenant-scoped)

export interface DecisionFramework extends SoftDeletableRow {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  version: number;
  is_default: boolean;
}

export interface DecisionFrameworkDimension extends AuditedRow {
  id: string;
  framework_id: string;
  dimension_key: ScoreDimensionKey;
  label: string;
  weight: number;
  display_order: number;
}

export interface DecisionSession extends SoftDeletableRow {
  id: string;
  organization_id: string;
  workspace_id: string;
  project_id: string;
  framework_id: string | null;
  title: string;
  status: DecisionSessionStatus;
}

export interface BusinessGoal extends SoftDeletableRow {
  id: string;
  organization_id: string;
  decision_session_id: string;
  goal_tag: GoalTag | null;
  custom_goal_text: string | null;
  priority: number | null;
}

export interface DecisionSessionCapability {
  decision_session_id: string;
  capability_id: string;
  priority: "must-have" | "nice-to-have";
  created_at: string;
  created_by: string | null;
}

export interface Requirement extends SoftDeletableRow {
  id: string;
  organization_id: string;
  decision_session_id: string;
  capability_id: string | null;
  title: string;
  description: string | null;
  is_mandatory: boolean;
}

export interface SessionConstraint extends SoftDeletableRow {
  id: string;
  organization_id: string;
  decision_session_id: string;
  constraint_type: ConstraintType;
  value: string;
  notes: string | null;
}

export interface Recommendation extends SoftDeletableRow {
  id: string;
  organization_id: string;
  decision_session_id: string;
  product_id: string;
  rank: number;
  overall_score: number;
  summary: string | null;
  is_primary: boolean;
  generated_at: string;
}

export interface DecisionScore extends SoftDeletableRow {
  id: string;
  organization_id: string;
  recommendation_id: string;
  dimension_key: ScoreDimensionKey;
  score: number;
  weight: number;
  positive_evidence: string[];
  negative_evidence: string[];
}

export interface DecisionReport extends SoftDeletableRow {
  id: string;
  organization_id: string;
  decision_session_id: string;
  executive_summary: string | null;
  full_report: Record<string, unknown>;
  generated_at: string;
  exported_at: string | null;
}

export interface EvidenceSource extends SoftDeletableRow {
  id: string;
  analyst_report_id: string | null;
  title: string;
  publisher: string | null;
  url: string | null;
  reliability_tier: EvidenceReliabilityTier;
  retrieved_at: string | null;
}

export interface SavedComparison extends SoftDeletableRow {
  id: string;
  organization_id: string;
  workspace_id: string | null;
  project_id: string | null;
  decision_session_id: string | null;
  name: string;
  notes: string | null;
}

export interface SavedComparisonProduct {
  saved_comparison_id: string;
  product_id: string;
  display_order: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Knowledge and AI

export interface KnowledgeArticle extends SoftDeletableRow {
  id: string;
  organization_id: string | null;
  title: string;
  slug: string;
  body: string | null;
  category: string | null;
  embedding: number[] | null;
  published_at: string | null;
}

export interface AiConversation extends SoftDeletableRow {
  id: string;
  organization_id: string;
  decision_session_id: string | null;
  user_id: string;
  title: string | null;
}

export interface AiMessage {
  id: string;
  organization_id: string;
  ai_conversation_id: string;
  role: AiMessageRole;
  content: string;
  embedding: number[] | null;
  created_at: string;
  created_by: string | null;
}

// ---------------------------------------------------------------------------
// Governance

export interface AuditLogEntry {
  id: string;
  organization_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
}
