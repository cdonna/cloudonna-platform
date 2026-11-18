import "server-only";

/** The only module that reads/writes commercial_conversions (brief
 * §17/§18) — recorded by staff once a real outcome is known. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateCommercialConversionRequest } from "./schema";
import type { ConversionType } from "./conversion-type";
import { logCommercialEvent } from "./events";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "You do not have access to commercial data.";
  return "The request could not be processed.";
}

export interface CommercialConversionSummary {
  id: string;
  fromAccountId: string;
  fromSprintId: string | null;
  fromOpportunityId: string | null;
  toOpportunityId: string | null;
  conversionType: ConversionType;
  conversionOutcome: string | null;
  conversionDate: string | null;
  conversionValueChf: number | null;
  createdAt: string;
}

const CONVERSION_SELECT =
  "id, from_account_id, from_sprint_id, from_opportunity_id, to_opportunity_id, conversion_type, conversion_outcome, conversion_date, conversion_value_chf, created_at";

interface ConversionRow {
  id: string;
  from_account_id: string;
  from_sprint_id: string | null;
  from_opportunity_id: string | null;
  to_opportunity_id: string | null;
  conversion_type: ConversionType;
  conversion_outcome: string | null;
  conversion_date: string | null;
  conversion_value_chf: number | null;
  created_at: string;
}

function mapConversion(row: ConversionRow): CommercialConversionSummary {
  return {
    id: row.id,
    fromAccountId: row.from_account_id,
    fromSprintId: row.from_sprint_id,
    fromOpportunityId: row.from_opportunity_id,
    toOpportunityId: row.to_opportunity_id,
    conversionType: row.conversion_type,
    conversionOutcome: row.conversion_outcome,
    conversionDate: row.conversion_date,
    conversionValueChf: row.conversion_value_chf,
    createdAt: row.created_at,
  };
}

const TEAM_EVENT_TYPES: ConversionType[] = ["sprint_to_team"];
const ENTERPRISE_EVENT_TYPES: ConversionType[] = ["team_to_enterprise", "sprint_to_enterprise"];

export async function createCommercialConversion(supabase: SupabaseClient, request: CreateCommercialConversionRequest): Promise<RepositoryResult<CommercialConversionSummary>> {
  const { data, error } = await supabase
    .from("commercial_conversions")
    .insert({
      from_account_id: request.fromAccountId,
      from_sprint_id: request.fromSprintId ?? null,
      from_opportunity_id: request.fromOpportunityId ?? null,
      to_opportunity_id: request.toOpportunityId ?? null,
      conversion_type: request.conversionType,
      conversion_outcome: request.conversionOutcome ?? null,
      conversion_date: request.conversionDate ?? null,
      conversion_value_chf: request.conversionValueChf ?? null,
    })
    .select(CONVERSION_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  const summary = mapConversion(data as ConversionRow);

  if (TEAM_EVENT_TYPES.includes(summary.conversionType)) await logCommercialEvent(supabase, "team_conversion", {});
  if (ENTERPRISE_EVENT_TYPES.includes(summary.conversionType)) await logCommercialEvent(supabase, "enterprise_expansion", {});

  return { ok: true, data: summary };
}

export async function listConversionsForAccount(supabase: SupabaseClient, accountId: string): Promise<RepositoryResult<CommercialConversionSummary[]>> {
  const { data, error } = await supabase.from("commercial_conversions").select(CONVERSION_SELECT).eq("from_account_id", accountId).order("created_at", { ascending: false });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as ConversionRow[] | null) ?? []).map(mapConversion) };
}

export async function listAllConversions(supabase: SupabaseClient): Promise<RepositoryResult<CommercialConversionSummary[]>> {
  const { data, error } = await supabase.from("commercial_conversions").select(CONVERSION_SELECT).order("created_at", { ascending: false });
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as ConversionRow[] | null) ?? []).map(mapConversion) };
}
