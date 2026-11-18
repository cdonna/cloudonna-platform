import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createActionItemRequestSchema } from "../schema";
import { createActionItem, listActionItemsForDecision, type DecisionActionItem } from "../action-items-repository";
import { resolveDecisionOrganizationId } from "../resolve-decision-organization";

export interface ActionItemHandlerResult {
  status: number;
  body: DecisionActionItem | DecisionActionItem[] | { error: string };
}

export async function handleCreateActionItemRequest(decisionId: string, rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<ActionItemHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to add an action item." } };

  const parsed = createActionItemRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const organizationId = await resolveDecisionOrganizationId(supabase, decisionId);
  if (!organizationId) return { status: 404, body: { error: "This decision could not be found." } };

  const result = await createActionItem(supabase, decisionId, organizationId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}

export async function handleListActionItemsRequest(decisionId: string, supabase: SupabaseClient, userId: string | null): Promise<ActionItemHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to view action items." } };

  const result = await listActionItemsForDecision(supabase, decisionId);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
