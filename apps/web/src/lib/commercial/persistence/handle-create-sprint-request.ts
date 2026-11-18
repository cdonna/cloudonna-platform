import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createDecisionSprintRequestSchema } from "../schema";
import { createDecisionSprint, type DecisionSprintSummary } from "../sprints-repository";

export interface CreateSprintHandlerResult {
  status: number;
  body: DecisionSprintSummary | { error: string };
}

export async function handleCreateSprintRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<CreateSprintHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to manage Decision Sprints." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = createDecisionSprintRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await createDecisionSprint(supabase, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
