/**
 * Vendor Intelligence & Evidence Graph V1 (brief §3-§14) — domain
 * types. Pure data shapes, no I/O, mirroring the schema in
 * supabase/migrations/20261117180000_vendor_intelligence_evidence_graph_v1.sql
 * field-for-field (snake_case in SQL, camelCase here, same naming
 * discipline every other persistence module in this codebase follows).
 *
 * `vendorSlug`/`productSlug` are the exact string ids already used by
 * the live VendorPlatformProfile catalog (../catalog.ts) and by
 * research_evidence.option_id — never a new identity space. See
 * docs/capabilities/vendor-intelligence-and-evidence-graph.md §A for
 * why this graph does not reuse or extend the legacy, unpopulated
 * `vendors`/`products` tables.
 */
import type { EvidenceType } from "@/components/showcase/EvidenceTag";

export const EVIDENCE_GRAPH_VERSION = "vendor-evidence-graph-v1";

// ---------------------------------------------------------------------------
// Capability taxonomy (brief §25/§26) — must match the seeded rows in
// capability_categories exactly. Kept here as a typed mirror for
// compile-time safety and client-side labels; the database table is the
// source of truth for what is actually insertable (an FK, not just a
// TS union).

export const CAPABILITY_CATEGORY_KEYS = [
  "architecture",
  "data_integration",
  "data_engineering",
  "data_warehouse",
  "lakehouse",
  "streaming",
  "governance",
  "data_quality",
  "master_data",
  "semantic_layer",
  "analytics",
  "planning",
  "ai_ml",
  "genai",
  "agentic_ai",
  "security",
  "compliance",
  "data_sovereignty",
  "observability",
  "developer_experience",
  "operations",
  "cost_management",
  "hybrid_multicloud",
  "sap_integration",
  "microsoft_integration",
  "google_integration",
  "aws_integration",
  "open_ecosystem",
] as const;

export type CapabilityCategoryKey = (typeof CAPABILITY_CATEGORY_KEYS)[number];

export interface CapabilityCategory {
  key: CapabilityCategoryKey;
  label: string;
  categoryGroup: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Source (brief §6) — deliberately a different vocabulary from
// EvidenceType (brief's own instruction: source taxonomy and evidence
// taxonomy answer different questions). Mirrors research/types.ts's
// existing SourceType union exactly — the same vocabulary Research
// Agent V1 already uses, not a second one invented for this graph.

export type EvidenceSourceCategory =
  | "official_vendor_documentation"
  | "official_product_documentation"
  | "official_security_compliance"
  | "official_architecture"
  | "official_pricing_licensing"
  | "official_release_notes"
  | "standards_body"
  | "independent_analysis"
  | "unknown";

/** Preference order for canonical vendor intelligence (brief §17) —
 * lower index = higher priority. Independent analysis may still
 * challenge an official claim (a CONTRADICTS relationship), but a
 * canonical fact should normally be anchored in something official. */
export const OFFICIAL_SOURCE_PRIORITY: EvidenceSourceCategory[] = [
  "official_product_documentation",
  "official_architecture",
  "official_security_compliance",
  "official_release_notes",
  "official_pricing_licensing",
  "standards_body",
  "independent_analysis",
  "official_vendor_documentation",
  "unknown",
];

export interface EvidenceSource {
  id: string;
  canonicalUrl: string;
  retrievedUrl: string;
  title: string;
  publisher: string;
  sourceCategory: EvidenceSourceCategory;
  publishedAt: string | null;
  retrievedAt: string;
  lastVerifiedAt: string | null;
  language: string | null;
  contentHash: string | null;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// CapabilityClaim (brief §5/§12) — two independent status axes, see the
// migration's own comment for why verification and lifecycle are not
// one enum.

export type ClaimVerificationStatus = "verified" | "partially_verified" | "conflicted" | "stale" | "unknown";
export type ClaimLifecycleStatus = "proposed" | "active" | "superseded" | "rejected";
export type EvidenceQualityTier = "high" | "medium" | "low";
export type EvidenceScope = "global" | "organization_private";

export interface CapabilityClaim {
  id: string;
  vendorSlug: string;
  productSlug: string;
  capabilityKey: CapabilityCategoryKey;
  claim: string;
  verificationStatus: ClaimVerificationStatus;
  lifecycleStatus: ClaimLifecycleStatus;
  evidenceQuality: EvidenceQualityTier | null;
  validFrom: string | null;
  validTo: string | null;
  lastVerifiedAt: string | null;
  version: number;
  supersededBy: string | null;
  scope: EvidenceScope;
  organizationId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Evidence (brief §7/§8) — Source -> Evidence -> Claim. Multiple rows
// with different sourceId values backing the same claimId is how
// "multiple sources per claim" is represented.

export type EvidencePolarity = "supports" | "contradicts";

export interface CapabilityEvidence {
  id: string;
  claimId: string;
  sourceId: string;
  polarity: EvidencePolarity;
  excerpt: string | null;
  confidence: "high" | "medium" | "low";
  researchSessionId: string | null;
  createdAt: string;
}

/** The full trace a user can open from a claim (brief §22): claim,
 * every piece of evidence for it, and each evidence's own source. */
export interface ClaimTrace {
  claim: CapabilityClaim;
  evidence: Array<{ evidence: CapabilityEvidence; source: EvidenceSource }>;
}

// ---------------------------------------------------------------------------
// Change detection (brief §36) and decision impact (brief §37/§39).

export type VendorKnowledgeChangeType =
  | "capability_changed"
  | "pricing_model_changed"
  | "region_availability_changed"
  | "security_certification_changed"
  | "product_status_changed"
  | "integration_changed";

export interface VendorKnowledgeChange {
  id: string;
  claimId: string;
  previousClaimId: string | null;
  changeType: VendorKnowledgeChangeType;
  summary: string;
  detectedAt: string;
  detectedBySourceId: string | null;
}

export type Materiality = "low" | "medium" | "high";

export interface DecisionImpact {
  id: string;
  decisionId: string;
  changeId: string;
  affectedOption: string;
  affectedCriterion: string | null;
  materiality: Materiality;
  recommendationImpact: string;
  reviewRecommended: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Decision-time snapshot (brief §34) — what a decision actually used.

export interface DecisionVendorClaimRef {
  claimId: string;
  claimVersionAtReference: number;
  verificationStatus: ClaimVerificationStatus;
}

// ---------------------------------------------------------------------------
// Knowledge precedence (brief §33) — documented order, used only to
// explain/display provenance, never to silently pick a "winning" value
// between sources of different scope.

export type KnowledgeSourceKind = Extract<EvidenceType, "observed-data" | "customer-input" | "official-source" | "ai-interpretation" | "assumption"> | "verified_global_claim";

export const KNOWLEDGE_PRECEDENCE: KnowledgeSourceKind[] = [
  "observed-data",
  "customer-input",
  "official-source",
  "verified_global_claim",
  "ai-interpretation",
  "assumption",
];
