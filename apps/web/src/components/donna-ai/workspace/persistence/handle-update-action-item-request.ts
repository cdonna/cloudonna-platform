import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateActionItemRequestSchema } from "../schema";
import { updateActionItem, type DecisionActionItem } from "../action-items-repository";

export interface UpdateActionItemHandlerResult {
  status: number;
  body: DecisionActionItem | { error: string };
}

export async function handleUpdateActionItemRequest(actionItemId: string, rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<UpdateActionItemHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to update an action item." } };

  const parsed = updateActionItemRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await updateActionItem(supabase, actionItemId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
