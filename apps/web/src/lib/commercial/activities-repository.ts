import "server-only";

/**
 * The only module that writes to commercial_activities (brief §40/§54)
 * — append-only commercial notes + the change trail for stage/value/
 * won-lost/contract/package changes. No update/delete function exists
 * here on purpose; the table has no update/delete RLS policy for any
 * role either.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "You do not have access to commercial data.";
  return "The request could not be processed.";
}

export interface CommercialActivitySummary {
  id: string;
  opportunityId: string | null;
  accountId: string | null;
  activityType: string;
  note: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  createdAt: string;
  createdBy: string | null;
}

const ACTIVITY_SELECT = "id, opportunity_id, account_id, activity_type, note, before_data, after_data, created_at, created_by";

interface ActivityRow {
  id: string;
  opportunity_id: string | null;
  account_id: string | null;
  activity_type: string;
  note: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
  created_by: string | null;
}

function mapActivity(row: ActivityRow): CommercialActivitySummary {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    accountId: row.account_id,
    activityType: row.activity_type,
    note: row.note,
    beforeData: row.before_data,
    afterData: row.after_data,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export interface RecordActivityInput {
  opportunityId?: string | null;
  accountId?: string | null;
  activityType: string;
  note?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
}

/** Fire-and-forget by convention at call sites — a failed activity
 * log must never roll back the real mutation it is describing. Each
 * caller decides whether to await and ignore, or just not await. */
export async function recordCommercialActivity(supabase: SupabaseClient, input: RecordActivityInput): Promise<RepositoryResult<CommercialActivitySummary>> {
  const { data, error } = await supabase
    .from("commercial_activities")
    .insert({
      opportunity_id: input.opportunityId ?? null,
      account_id: input.accountId ?? null,
      activity_type: input.activityType,
      note: input.note ?? null,
      before_data: input.beforeData ?? null,
      after_data: input.afterData ?? null,
    })
    .select(ACTIVITY_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapActivity(data as ActivityRow) };
}

export async function listActivitiesForOpportunity(supabase: SupabaseClient, opportunityId: string): Promise<RepositoryResult<CommercialActivitySummary[]>> {
  const { data, error } = await supabase.from("commercial_activities").select(ACTIVITY_SELECT).eq("opportunity_id", opportunityId).order("created_at", { ascending: false });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as ActivityRow[] | null) ?? []).map(mapActivity) };
}

export async function listActivitiesForAccount(supabase: SupabaseClient, accountId: string): Promise<RepositoryResult<CommercialActivitySummary[]>> {
  const { data, error } = await supabase.from("commercial_activities").select(ACTIVITY_SELECT).eq("account_id", accountId).order("created_at", { ascending: false });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as ActivityRow[] | null) ?? []).map(mapActivity) };
}

/** Every stage-change activity ever recorded, across all
 * opportunities — the real data source for funnel.ts and
 * sales-velocity.ts (brief §19/§20). Never joined with account/
 * contact PII; only the stage values themselves. */
export async function listAllStageChangeActivities(supabase: SupabaseClient): Promise<RepositoryResult<{ opportunityId: string; afterStage: string | null; createdAt: string }[]>> {
  const { data, error } = await supabase.from("commercial_activities").select("opportunity_id, after_data, created_at").eq("activity_type", "stage_changed").order("created_at", { ascending: true });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return {
    ok: true,
    data: ((data as { opportunity_id: string | null; after_data: Record<string, unknown> | null; created_at: string }[] | null) ?? [])
      .filter((r): r is { opportunity_id: string; after_data: Record<string, unknown> | null; created_at: string } => r.opportunity_id !== null)
      .map((r) => ({ opportunityId: r.opportunity_id, afterStage: (r.after_data?.stage as string | undefined) ?? null, createdAt: r.created_at })),
  };
}
