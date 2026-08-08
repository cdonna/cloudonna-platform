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
      source_page: request.sourcePage ?? null,
      utm_source: request.utmSource ?? null,
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
  owner: string | null;
  ownerEmail: string | null;
  createdAt: string;
}

/** Powers the Founder Dashboard. RLS (inquiries_select_staff) is the
 * actual enforcement — this function issues no explicit staff check of
 * its own, matching the rest of this codebase's "RLS is the real
 * boundary, the repository is just a typed surface over it" posture. A
 * non-staff caller gets an empty list, not an error, the same
 * "not-found and not-allowed look identical" posture as
 * getDecisionDetail(). */
export async function listInquiriesForStaff(supabase: SupabaseClient): Promise<RepositoryResult<InquirySummary[]>> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("id, inquiry_type, name, business_email, company, country, status, owner, created_at, profiles:owner(email)")
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, reason: classifySupabaseError(error.message) };
  }

  const items: InquirySummary[] = (data ?? []).map((row) => {
    const ownerProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      inquiryType: row.inquiry_type,
      name: row.name,
      businessEmail: row.business_email,
      company: row.company,
      country: row.country,
      status: row.status,
      owner: row.owner,
      ownerEmail: ownerProfile?.email ?? null,
      createdAt: row.created_at,
    };
  });

  return { ok: true, data: items };
}
