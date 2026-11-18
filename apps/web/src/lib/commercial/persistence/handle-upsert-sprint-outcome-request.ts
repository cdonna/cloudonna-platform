import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertDecisionSprintOutcomeRequestSchema } from "../schema";
import { upsertSprintOutcome, type DecisionSprintOutcomeSummary } from "../sprints-repository";

export interface UpsertSprintOutcomeHandlerResult {
  status: number;
  body: DecisionSprintOutcomeSummary | { error: string };
}

export async function handleUpsertSprintOutcomeRequest(sprintId: string, rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<UpsertSprintOutcomeHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to record a Decision Sprint outcome." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = upsertDecisionSprintOutcomeRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const result = await upsertSprintOutcome(supabase, sprintId, parsed.data);
  if (!result.ok) return { status: 400, body: { error: result.reason } };
  return { status: 200, body: result.data };
}
