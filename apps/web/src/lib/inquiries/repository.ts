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

/** Deliberately no `.select().single()` after the insert — a plain
 * INSERT ... RETURNING id, run as the anon/authenticated role a public
 * submitter connects as, is subject to inquiries_select_staff (RLS
 * still governs RETURNING output, not just a separate SELECT
 * statement), which is staff-only. inquiries_insert_public grants the
 * INSERT itself, but a non-staff inserter can never see the row it
 * just created — so asking Postgres to hand the id back always failed
 * with 42501 for exactly the visitors this endpoint exists for. There
 * is no id to return without either granting anon a SELECT policy on
 * inquiries (ruled out — see docs/operations/05-inquiry-system-v2.md)
 * or a service-role bypass (ruled out — no service-role client exists
 * in this domain). Persistence success/failure is the only thing this
 * function can honestly report. */
export async function createInquiry(
  supabase: SupabaseClient,
  request: CreateInquiryRequest,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { error } = await supabase.from("inquiries").insert({
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
  });

  if (error) {
    // The raw Postgres error (e.g. "invalid input value for enum
    // inquiry_type") is safe to log server-side — it's a schema-level
    // technical detail, never user content or a credential — and it's
    // exactly the detail classifySupabaseError() strips before
    // anything reaches the client or even this function's own caller.
    // Logged here, at the one place it's still in scope, rather than
    // threaded through the return type just to be logged one level up.
    console.error(`[inquiries] database_error code=${error.code ?? "unknown"} message=${error.message}`);
    return { ok: false, reason: classifySupabaseError(error.message) };
  }

  return { ok: true };
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
