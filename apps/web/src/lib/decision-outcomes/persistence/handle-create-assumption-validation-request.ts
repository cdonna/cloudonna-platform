import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAssumptionValidationRequestSchema } from "../schema";
import { createAssumptionValidation, listAssumptionValidations, type AssumptionValidationSummary } from "../repository";
import { resolveDecisionOrganizationId } from "./resolve-decision-organization";

export interface AssumptionValidationHandlerResult {
  status: number;
  body: AssumptionValidationSummary | AssumptionValidationSummary[] | { error: string };
}

export async function handleCreateAssumptionValidationRequest(
  decisionId: string,
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<AssumptionValidationHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to record an assumption." } };

  const parsed = createAssumptionValidationRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const organizationId = await resolveDecisionOrganizationId(supabase, decisionId);
  if (!organizationId) return { status: 404, body: { error: "This decision could not be found." } };

  const result = await createAssumptionValidation(supabase, decisionId, organizationId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}

export async function handleListAssumptionValidationsRequest(decisionId: string, supabase: SupabaseClient, userId: string | null): Promise<AssumptionValidationHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to view assumptions." } };

  const result = await listAssumptionValidations(supabase, decisionId);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
