import "server-only";

/**
 * The only module that issues a Supabase query against
 * vendor_capability_claims / vendor_capability_evidence /
 * evidence_sources / vendor_knowledge_changes / decision_impacts /
 * decision_vendor_claim_refs — same pattern as research-repository.ts
 * and decisions-repository.ts: takes an already-constructed
 * per-request server client, never a service-role key, so RLS is the
 * real enforcement and this file is a typed, narrow surface over it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CapabilityClaim,
  CapabilityEvidence,
  ClaimTrace,
  DecisionImpact,
  DecisionVendorClaimRef,
  EvidenceSource,
  VendorKnowledgeChange,
} from "../types";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifySupabaseError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "You do not have access to this vendor knowledge.";
  }
  return "The request could not be processed.";
}

interface ClaimRow {
  id: string;
  vendor_slug: string;
  product_slug: string;
  capability_key: string;
  claim: string;
  verification_status: CapabilityClaim["verificationStatus"];
  lifecycle_status: CapabilityClaim["lifecycleStatus"];
  evidence_quality: CapabilityClaim["evidenceQuality"];
  valid_from: string | null;
  valid_to: string | null;
  last_verified_at: string | null;
  version: number;
  superseded_by: string | null;
  scope: CapabilityClaim["scope"];
  organization_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapClaim(row: ClaimRow): CapabilityClaim {
  return {
    id: row.id,
    vendorSlug: row.vendor_slug,
    productSlug: row.product_slug,
    capabilityKey: row.capability_key as CapabilityClaim["capabilityKey"],
    claim: row.claim,
    verificationStatus: row.verification_status,
    lifecycleStatus: row.lifecycle_status,
    evidenceQuality: row.evidence_quality,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    lastVerifiedAt: row.last_verified_at,
    version: row.version,
    supersededBy: row.superseded_by,
    scope: row.scope,
    organizationId: row.organization_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CLAIM_COLUMNS =
  "id, vendor_slug, product_slug, capability_key, claim, verification_status, lifecycle_status, evidence_quality, valid_from, valid_to, last_verified_at, version, superseded_by, scope, organization_id, notes, created_at, updated_at";

/**
 * Every ACTIVE claim for one product: global claims plus, when
 * `organizationId` is given, that organization's own private claims
 * too (brief §32 — never another organization's). RLS on
 * vendor_capability_claims already enforces this at the database
 * level; the explicit `.or()` here is what lets a single query pull
 * both scopes at once instead of two round trips.
 */
export async function listActiveClaimsForProduct(
  supabase: SupabaseClient,
  productSlug: string,
  organizationId: string | null,
): Promise<RepositoryResult<CapabilityClaim[]>> {
  let query = supabase
    .from("vendor_capability_claims")
    .select(CLAIM_COLUMNS)
    .eq("product_slug", productSlug)
    .eq("lifecycle_status", "active");

  query = organizationId ? query.or(`scope.eq.global,organization_id.eq.${organizationId}`) : query.eq("scope", "global");

  const { data, error } = await query;
  if (error) return { ok: false, reason: classifySupabaseError(error.message) };
  return { ok: true, data: ((data as ClaimRow[] | null) ?? []).map(mapClaim) };
}

export async function getClaimById(supabase: SupabaseClient, claimId: string): Promise<RepositoryResult<CapabilityClaim>> {
  const { data, error } = await supabase.from("vendor_capability_claims").select(CLAIM_COLUMNS).eq("id", claimId).maybeSingle();
  if (error) return { ok: false, reason: classifySupabaseError(error.message) };
  if (!data) return { ok: false, reason: "Claim not found or not accessible." };
  return { ok: true, data: mapClaim(data as ClaimRow) };
}

interface EvidenceRow {
  id: string;
  claim_id: string;
  source_id: string;
  polarity: CapabilityEvidence["polarity"];
  excerpt: string | null;
  confidence: CapabilityEvidence["confidence"];
  research_session_id: string | null;
  created_at: string;
  evidence_sources: SourceRow | SourceRow[] | null;
}

interface SourceRow {
  id: string;
  canonical_url: string;
  retrieved_url: string;
  title: string;
  publisher: string;
  source_category: EvidenceSource["sourceCategory"];
  published_at: string | null;
  retrieved_at: string;
  last_verified_at: string | null;
  language: string | null;
  content_hash: string | null;
  metadata: Record<string, unknown>;
}

function mapSource(row: SourceRow): EvidenceSource {
  return {
    id: row.id,
    canonicalUrl: row.canonical_url,
    retrievedUrl: row.retrieved_url,
    title: row.title,
    publisher: row.publisher,
    sourceCategory: row.source_category,
    publishedAt: row.published_at,
    retrievedAt: row.retrieved_at,
    lastVerifiedAt: row.last_verified_at,
    language: row.language,
    contentHash: row.content_hash,
    metadata: row.metadata ?? {},
  };
}

function mapEvidence(row: EvidenceRow): CapabilityEvidence {
  return {
    id: row.id,
    claimId: row.claim_id,
    sourceId: row.source_id,
    polarity: row.polarity,
    excerpt: row.excerpt,
    confidence: row.confidence,
    researchSessionId: row.research_session_id,
    createdAt: row.created_at,
  };
}

/**
 * The full trace (brief §22): claim, every piece of evidence for it,
 * and each evidence's own source — exactly the chain a user should be
 * able to open from any capability claim.
 */
export async function getClaimTrace(supabase: SupabaseClient, claimId: string): Promise<RepositoryResult<ClaimTrace>> {
  const claimResult = await getClaimById(supabase, claimId);
  if (!claimResult.ok) return claimResult;

  const { data, error } = await supabase
    .from("vendor_capability_evidence")
    .select(
      "id, claim_id, source_id, polarity, excerpt, confidence, research_session_id, created_at, evidence_sources(id, canonical_url, retrieved_url, title, publisher, source_category, published_at, retrieved_at, last_verified_at, language, content_hash, metadata)",
    )
    .eq("claim_id", claimId);

  if (error) return { ok: false, reason: classifySupabaseError(error.message) };

  const rows = (data as EvidenceRow[] | null) ?? [];
  const evidence = rows
    .map((row) => {
      const sourceRow = Array.isArray(row.evidence_sources) ? row.evidence_sources[0] : row.evidence_sources;
      if (!sourceRow) return null;
      return { evidence: mapEvidence(row), source: mapSource(sourceRow) };
    })
    .filter((e): e is { evidence: CapabilityEvidence; source: EvidenceSource } => e !== null);

  return { ok: true, data: { claim: claimResult.data, evidence } };
}

/** Pins the exact claim versions a decision used (brief §34). Silent
 * no-op on an empty list — a decision with no vendor-knowledge
 * references yet is a legitimate, honest state, not an error. */
export async function recordDecisionVendorClaimRefs(
  supabase: SupabaseClient,
  decisionId: string,
  organizationId: string,
  refs: DecisionVendorClaimRef[],
): Promise<RepositoryResult<void>> {
  if (refs.length === 0) return { ok: true, data: undefined };
  // upsert + ignoreDuplicates, not insert: this handler fires every
  // time a decision's vendor-knowledge panel is opened, and
  // decision_vendor_claim_refs_unique (decision_id, claim_id,
  // claim_version_at_reference) is expected to be hit again on a
  // second view of the same claim version — that is a no-op, not an
  // error, since the snapshot for that version is already recorded.
  const { error } = await supabase
    .from("decision_vendor_claim_refs")
    .upsert(
      refs.map((r) => ({
        decision_id: decisionId,
        organization_id: organizationId,
        claim_id: r.claimId,
        claim_version_at_reference: r.claimVersionAtReference,
      })),
      { onConflict: "decision_id,claim_id,claim_version_at_reference", ignoreDuplicates: true },
    );
  if (error) return { ok: false, reason: classifySupabaseError(error.message) };
  return { ok: true, data: undefined };
}

export async function listKnowledgeChangesForClaims(supabase: SupabaseClient, claimIds: string[]): Promise<RepositoryResult<VendorKnowledgeChange[]>> {
  if (claimIds.length === 0) return { ok: true, data: [] };
  const { data, error } = await supabase
    .from("vendor_knowledge_changes")
    .select("id, claim_id, previous_claim_id, change_type, summary, detected_at, detected_by_source_id")
    .in("claim_id", claimIds)
    .order("detected_at", { ascending: false });

  if (error) return { ok: false, reason: classifySupabaseError(error.message) };
  const rows = (data as Array<{
    id: string;
    claim_id: string;
    previous_claim_id: string | null;
    change_type: VendorKnowledgeChange["changeType"];
    summary: string;
    detected_at: string;
    detected_by_source_id: string | null;
  }> | null) ?? [];
  return {
    ok: true,
    data: rows.map((r) => ({
      id: r.id,
      claimId: r.claim_id,
      previousClaimId: r.previous_claim_id,
      changeType: r.change_type,
      summary: r.summary,
      detectedAt: r.detected_at,
      detectedBySourceId: r.detected_by_source_id,
    })),
  };
}

export async function recordDecisionImpact(
  supabase: SupabaseClient,
  organizationId: string,
  draft: { decisionId: string; changeId: string; affectedOption: string; affectedCriterion: string | null; materiality: string; recommendationImpact: string; reviewRecommended: boolean },
): Promise<RepositoryResult<DecisionImpact>> {
  const { data, error } = await supabase
    .from("decision_impacts")
    .insert({
      decision_id: draft.decisionId,
      organization_id: organizationId,
      change_id: draft.changeId,
      affected_option: draft.affectedOption,
      affected_criterion: draft.affectedCriterion,
      materiality: draft.materiality,
      recommendation_impact: draft.recommendationImpact,
      review_recommended: draft.reviewRecommended,
    })
    .select("id, decision_id, change_id, affected_option, affected_criterion, materiality, recommendation_impact, review_recommended, created_at")
    .single();

  if (error) return { ok: false, reason: classifySupabaseError(error.message) };
  return {
    ok: true,
    data: {
      id: data.id,
      decisionId: data.decision_id,
      changeId: data.change_id,
      affectedOption: data.affected_option,
      affectedCriterion: data.affected_criterion,
      materiality: data.materiality,
      recommendationImpact: data.recommendation_impact,
      reviewRecommended: data.review_recommended,
      createdAt: data.created_at,
    },
  };
}

export async function listDecisionImpacts(supabase: SupabaseClient, decisionId: string): Promise<RepositoryResult<DecisionImpact[]>> {
  const { data, error } = await supabase
    .from("decision_impacts")
    .select("id, decision_id, change_id, affected_option, affected_criterion, materiality, recommendation_impact, review_recommended, created_at")
    .eq("decision_id", decisionId)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, reason: classifySupabaseError(error.message) };
  const rows = (data as Array<{
    id: string;
    decision_id: string;
    change_id: string;
    affected_option: string;
    affected_criterion: string | null;
    materiality: DecisionImpact["materiality"];
    recommendation_impact: string;
    review_recommended: boolean;
    created_at: string;
  }> | null) ?? [];
  return {
    ok: true,
    data: rows.map((r) => ({
      id: r.id,
      decisionId: r.decision_id,
      changeId: r.change_id,
      affectedOption: r.affected_option,
      affectedCriterion: r.affected_criterion,
      materiality: r.materiality,
      recommendationImpact: r.recommendation_impact,
      reviewRecommended: r.review_recommended,
      createdAt: r.created_at,
    })),
  };
}
