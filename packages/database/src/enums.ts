/**
 * Hand-authored mirror of every `create type ... as enum` statement in
 * supabase/migrations/20260806120100_enums.sql. There is no live Supabase
 * project yet, so these cannot be produced by `supabase gen types
 * typescript` — once a real project exists, that command should generate
 * database.types.ts and this file's enum exports should be re-pointed at
 * it, not maintained by hand forever. Keep these in sync with the
 * migration file if either changes before then.
 */

export const MATURITY_BANDS = ["emerging", "developing", "established", "leading"] as const;
export type MaturityBand = (typeof MATURITY_BANDS)[number];

export const SCORE_DIMENSION_KEYS = [
  "architecture",
  "business",
  "technology",
  "governance",
  "ai_readiness",
  "security",
  "ecosystem",
  "cost",
  "time_to_value",
  "strategic",
] as const;
export type ScoreDimensionKey = (typeof SCORE_DIMENSION_KEYS)[number];

export const CLOUD_MODELS = ["single-cloud", "multi-cloud", "hybrid", "on-premise-capable"] as const;
export type CloudModel = (typeof CLOUD_MODELS)[number];

export const DEPLOYMENT_MODELS = ["saas", "paas", "iaas", "managed-service", "self-hosted"] as const;
export type DeploymentModel = (typeof DEPLOYMENT_MODELS)[number];

export const COST_TIERS = ["entry", "mid", "premium", "enterprise-custom"] as const;
export type CostTier = (typeof COST_TIERS)[number];

export const IMPLEMENTATION_COMPLEXITIES = ["low", "medium", "high", "very-high"] as const;
export type ImplementationComplexity = (typeof IMPLEMENTATION_COMPLEXITIES)[number];

export const TIME_TO_VALUE_BANDS = ["weeks", "1-3-months", "3-6-months", "6-plus-months"] as const;
export type TimeToValueBand = (typeof TIME_TO_VALUE_BANDS)[number];

export const LOCK_IN_RISKS = ["low", "medium", "high", "very-high"] as const;
export type LockInRisk = (typeof LOCK_IN_RISKS)[number];

export const PLATFORM_CATEGORIES = [
  "data-platform",
  "hyperscale-cloud",
  "operational-database",
  "enterprise-legacy",
  "decision-ops-intelligence",
] as const;
export type PlatformCategory = (typeof PLATFORM_CATEGORIES)[number];

export const EMPLOYEE_BANDS = ["smb", "mid-market", "enterprise", "global-enterprise"] as const;
export type EmployeeBand = (typeof EMPLOYEE_BANDS)[number];

export const GOAL_TAGS = [
  "modernization",
  "business-ai",
  "planning",
  "governance",
  "data-products",
  "cost-reduction",
  "compliance",
  "innovation",
] as const;
export type GoalTag = (typeof GOAL_TAGS)[number];

export const TRAITS = [
  "sap-native",
  "governed-data",
  "modern-architecture",
  "multi-cloud",
  "enterprise-scale",
  "cost-efficient",
  "ai-ready",
  "azure-aligned",
  "aws-aligned",
  "gcp-aligned",
  "hyperscale-infra",
  "operational-workload",
  "high-touch-enterprise",
  "legacy-integration",
  "vendor-neutral",
] as const;
export type Trait = (typeof TRAITS)[number];

export const ORGANIZATION_MEMBER_ROLES = ["owner", "admin", "member", "viewer"] as const;
export type OrganizationMemberRole = (typeof ORGANIZATION_MEMBER_ROLES)[number];

export const DECISION_SESSION_STATUSES = ["draft", "in_progress", "completed", "archived"] as const;
export type DecisionSessionStatus = (typeof DECISION_SESSION_STATUSES)[number];

export const CONSTRAINT_TYPES = [
  "budget",
  "timeline",
  "risk_appetite",
  "preferred_cloud",
  "preferred_vendor",
  "internal_skills",
  "other",
] as const;
export type ConstraintType = (typeof CONSTRAINT_TYPES)[number];

export const EVIDENCE_RELIABILITY_TIERS = [
  "primary_source",
  "vendor_published",
  "analyst_report",
  "community",
  "internal_review",
] as const;
export type EvidenceReliabilityTier = (typeof EVIDENCE_RELIABILITY_TIERS)[number];

export const VERIFICATION_STATUSES = ["unverified", "pending", "verified", "rejected"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const AI_MESSAGE_ROLES = ["system", "user", "assistant", "tool"] as const;
export type AiMessageRole = (typeof AI_MESSAGE_ROLES)[number];
