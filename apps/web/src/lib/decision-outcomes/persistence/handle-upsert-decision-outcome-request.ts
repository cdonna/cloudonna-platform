import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertDecisionOutcomeRequestSchema } from "../schema";
import { upsertDecisionOutcome, type DecisionOutcomeSummary } from "../repository";
import { resolveDecisionOrganizationId } from "./resolve-decision-organization";

export interface UpsertDecisionOutcomeHandlerResult {
  status: number;
  body: DecisionOutcomeSummary | { error: string };
}

export async function handleUpsertDecisionOutcomeRequest(
  decisionId: string,
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<UpsertDecisionOutcomeHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to record a decision outcome." } };

  const parsed = upsertDecisionOutcomeRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const organizationId = await resolveDecisionOrganizationId(supabase, decisionId);
  if (!organizationId) return { status: 404, body: { error: "This decision could not be found." } };

  const result = await upsertDecisionOutcome(supabase, decisionId, organizationId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
