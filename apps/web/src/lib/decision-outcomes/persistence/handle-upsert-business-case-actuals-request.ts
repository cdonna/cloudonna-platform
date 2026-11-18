import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertBusinessCaseActualsRequestSchema } from "../schema";
import { upsertBusinessCaseActuals, type BusinessCaseActualsSummary } from "../repository";
import { resolveDecisionOrganizationId } from "./resolve-decision-organization";

export interface UpsertBusinessCaseActualsHandlerResult {
  status: number;
  body: BusinessCaseActualsSummary | { error: string };
}

export async function handleUpsertBusinessCaseActualsRequest(
  decisionId: string,
  rawBody: unknown,
  supabase: SupabaseClient,
  userId: string | null,
): Promise<UpsertBusinessCaseActualsHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to record business case actuals." } };

  const parsed = upsertBusinessCaseActualsRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const organizationId = await resolveDecisionOrganizationId(supabase, decisionId);
  if (!organizationId) return { status: 404, body: { error: "This decision could not be found." } };

  const result = await upsertBusinessCaseActuals(supabase, decisionId, organizationId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
