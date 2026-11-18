import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { updateDecisionSprintRequestSchema } from "../schema";
import { updateDecisionSprint, type DecisionSprintSummary } from "../sprints-repository";

export interface UpdateSprintHandlerResult {
  status: number;
  body: DecisionSprintSummary | { error: string };
}

export async function handleUpdateSprintRequest(sprintId: string, rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<UpdateSprintHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to manage Decision Sprints." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = updateDecisionSprintRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await updateDecisionSprint(supabase, sprintId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
