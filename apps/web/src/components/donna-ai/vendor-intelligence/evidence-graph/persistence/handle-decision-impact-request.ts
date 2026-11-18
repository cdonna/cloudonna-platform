import "server-only";

/**
 * Framework-independent handler behind POST
 * /api/vendor-intelligence/decisions/[id]/impact (brief §37/§38). Given
 * a decision and a canonical vendor-knowledge change, computes whether
 * that change is material to this specific decision's current
 * recommendation, and persists the result as an advisory
 * DecisionImpact row — never touching decisions/decision_versions
 * themselves. A human decides whether to reopen the decision; this
 * only tells them whether it is worth looking at.
 */
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDecisionDetail } from "../../../persistence/decisions-repository";
import { analyzeDecisionImpact } from "../impact-analysis";
import { getClaimById, recordDecisionImpact } from "./vendor-knowledge-repository";
import type { CapabilityCategoryKey, VendorKnowledgeChangeType } from "../types";

const decisionImpactRequestSchema = z
  .object({
    changeId: z.string().uuid(),
    claimId: z.string().uuid(),
    changeType: z.enum([
      "capability_changed",
      "pricing_model_changed",
      "region_availability_changed",
      "security_certification_changed",
      "product_status_changed",
      "integration_changed",
    ]),
  })
  .strict();

export interface DecisionImpactHandlerResult {
  status: number;
  body:
    | {
        decisionId: string;
        affectedOption: string;
        affectedCriterion: string | null;
        materiality: string;
        recommendationImpact: string;
        reviewRecommended: boolean;
      }
    | { error: string };
}

export async function handleDecisionImpactRequest(
  decisionId: string,
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<DecisionImpactHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to check decision impact." } };

  const parsed = decisionImpactRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const decisionResult = await getDecisionDetail(supabase, decisionId);
  if (!decisionResult.ok) return { status: 404, body: { error: decisionResult.reason } };

  const engineResult = decisionResult.data.version.deterministicOutput.engineResult;
  if (!engineResult) return { status: 400, body: { error: "This decision has no engine result to check impact against." } };

  const claimResult = await getClaimById(supabase, parsed.data.claimId);
  if (!claimResult.ok) return { status: 404, body: { error: claimResult.reason } };

  const draft = analyzeDecisionImpact({
    decisionId,
    changeId: parsed.data.changeId,
    affectedProductSlug: claimResult.data.productSlug,
    affectedCapabilityKey: claimResult.data.capabilityKey as CapabilityCategoryKey,
    changeType: parsed.data.changeType as VendorKnowledgeChangeType,
    engineResult,
  });

  // getDecisionDetail already proved this decision is accessible to
  // the caller (RLS returns no row otherwise) — this second lookup
  // only recovers organization_id for the decision_impacts insert,
  // never a second authorization check.
  const { data: decisionRow } = await supabase.from("decisions").select("organization_id").eq("id", decisionId).maybeSingle();
  const organizationId = decisionRow?.organization_id as string | undefined;
  if (!organizationId) return { status: 400, body: { error: "This decision's organization could not be resolved." } };

  const saved = await recordDecisionImpact(supabase, organizationId, draft);
  if (!saved.ok) return { status: 400, body: { error: saved.reason } };

  return {
    status: 200,
    body: {
      decisionId,
      affectedOption: saved.data.affectedOption,
      affectedCriterion: saved.data.affectedCriterion,
      materiality: saved.data.materiality,
      recommendationImpact: saved.data.recommendationImpact,
      reviewRecommended: saved.data.reviewRecommended,
    },
  };
}
