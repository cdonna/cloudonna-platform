import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createStakeholderRequestSchema } from "../schema";
import { createStakeholder, listStakeholdersForDecision, type DecisionStakeholder } from "../stakeholders-repository";
import { resolveDecisionOrganizationId } from "../resolve-decision-organization";

export interface StakeholderHandlerResult {
  status: number;
  body: DecisionStakeholder | DecisionStakeholder[] | { error: string };
}

export async function handleCreateStakeholderRequest(decisionId: string, rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<StakeholderHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to add a stakeholder." } };

  const parsed = createStakeholderRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const organizationId = await resolveDecisionOrganizationId(supabase, decisionId);
  if (!organizationId) return { status: 404, body: { error: "This decision could not be found." } };

  const result = await createStakeholder(supabase, decisionId, organizationId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}

export async function handleListStakeholdersRequest(decisionId: string, supabase: SupabaseClient, userId: string | null): Promise<StakeholderHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to view stakeholders." } };

  const result = await listStakeholdersForDecision(supabase, decisionId);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
