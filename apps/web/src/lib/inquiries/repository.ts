import "server-only";

/**
 * The only module that writes to or reads from `inquiries`. Takes an
 * already-constructed per-request server client, same convention as
 * decisions-repository.ts — an unauthenticated visitor's request runs
 * as Postgres role `anon`, which the inquiries_insert_public RLS policy
 * explicitly permits; nothing here bypasses RLS with a service-role key.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateInquiryRequest } from "./schema";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifySupabaseError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "This inquiry could not be submitted.";
  }
  if (lower.includes("check constraint") || lower.includes("violates check")) {
    return "Please check the form for invalid values and try again.";
  }
  return "This inquiry could not be submitted. Please try again.";
}

/** Backs the application-level rate limit — calls
 * count_recent_inquiries_by_email(), the one narrow read anon is
 * allowed against this table (a count for its own email, nothing
 * else). Fails open (returns 0) on any error: a rate-limit check that
 * can't run must never block a legitimate submission from a real
 * infrastructure hiccup — the DB-level constraints and RLS are still
 * there as the real backstop either way. */
export async function countRecentInquiriesByEmail(supabase: SupabaseClient, businessEmail: string): Promise<number> {
  const { data, error } = await supabase.rpc("count_recent_inquiries_by_email", { p_email: businessEmail });
  if (error || typeof data !== "number") {
    return 0;
  }
  return data;
}

export interface CreateInquiryResult {
  id: string;
}

export async function createInquiry(
  supabase: SupabaseClient,
  request: CreateInquiryRequest,
): Promise<RepositoryResult<CreateInquiryResult>> {
  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      inquiry_type: request.inquiryType,
      name: request.name,
      business_email: request.businessEmail,
      company: request.company ?? null,
      role: request.role ?? null,
      country: request.country ?? null,
      phone: request.phone ?? null,
      message: request.message ?? null,
      source_page: request.sourcePage,
      utm_source: request.utmSource ?? null,
      utm_medium: request.utmMedium ?? null,
      utm_campaign: request.utmCampaign ?? null,
      referrer: request.referrer ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, reason: classifySupabaseError(error.message) };
  }

  return { ok: true, data: { id: data.id } };
}

export interface InquirySummary {
  id: string;
  inquiryType: string;
  name: string;
  businessEmail: string;
  company: string | null;
  country: string | null;
  status: string;
  message: string | null;
  sourcePage: string | null;
  createdAt: string;
}

/** Powers /app/inquiries. RLS (inquiries_select_staff) is the actual
 * enforcement — this function issues no explicit staff check of its
 * own, matching the rest of this codebase's "RLS is the real boundary,
 * the repository is just a typed surface over it" posture. A non-staff
 * caller gets an empty list, not an error, the same "not-found and
 * not-allowed look identical" posture as getDecisionDetail(). */
export async function listInquiriesForStaff(supabase: SupabaseClient): Promise<RepositoryResult<InquirySummary[]>> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("id, inquiry_type, name, business_email, company, country, status, message, source_page, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, reason: classifySupabaseError(error.message) };
  }

  const items: InquirySummary[] = (data ?? []).map((row) => ({
    id: row.id,
    inquiryType: row.inquiry_type,
    name: row.name,
    businessEmail: row.business_email,
    company: row.company,
    country: row.country,
    status: row.status,
    message: row.message,
    sourcePage: row.source_page,
    createdAt: row.created_at,
  }));

  return { ok: true, data: items };
}

export const VALID_STATUSES = ["new", "reviewing", "contacted", "qualified", "closed"] as const;
export type InquiryStatus = (typeof VALID_STATUSES)[number];

/** The one mutation /app/inquiries supports — status changes only, no
 * owner assignment, no notes, no workflow engine. RLS
 * (inquiries_update_staff) is the real enforcement; a non-staff caller
 * updates zero rows (Postgres UPDATE against a row RLS hides is a
 * silent no-op, not an error) rather than a distinct "not allowed"
 * signal. */
export async function updateInquiryStatus(
  supabase: SupabaseClient,
  inquiryId: string,
  status: InquiryStatus,
): Promise<RepositoryResult<{ id: string }>> {
  const { data, error } = await supabase.from("inquiries").update({ status }).eq("id", inquiryId).select("id").maybeSingle();

  if (error) {
    return { ok: false, reason: classifySupabaseError(error.message) };
  }
  if (!data) {
    return { ok: false, reason: "This inquiry could not be updated." };
  }

  return { ok: true, data: { id: data.id } };
}
