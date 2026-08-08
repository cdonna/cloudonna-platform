import "server-only";

/**
 * Framework-independent handler behind app/api/inquiries/route.ts —
 * same pattern as handle-save-decision-request.ts: testable with plain
 * objects, the route file stays a thin adapter. Deliberately takes no
 * userId/auth requirement — this is the one write path in the schema
 * that anonymous visitors are meant to use.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createInquiryRequestSchema } from "./schema";
import { createInquiry, countRecentInquiriesByEmail } from "./repository";
import { getNotificationProvider } from "../notifications/config";

export interface CreateInquiryHandlerResult {
  status: number;
  body: { id: string } | { error: string };
}

const RATE_LIMIT_MAX_PER_HOUR = 3;

export async function handleCreateInquiryRequest(
  rawBody: unknown,
  supabase: SupabaseClient,
): Promise<CreateInquiryHandlerResult> {
  const parsed = createInquiryRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { status: 400, body: { error: "Please check the form for missing or invalid fields." } };
  }
  const request = parsed.data;

  // Honeypot: a real visitor never sees or fills this field (hidden via
  // CSS in InquiryForm). A filled value is a near-certain bot. Return a
  // fake success rather than a 400 — rejecting outright just teaches
  // the bot what to fix, silently accepting teaches it nothing while
  // storing nothing either.
  if (request.website) {
    return { status: 200, body: { id: "00000000-0000-0000-0000-000000000000" } };
  }

  // Simple, DB-backed rate limit — no new infrastructure, just the one
  // narrow security-definer count this schema already exposes. Fails
  // open (see countRecentInquiriesByEmail's own comment): if the check
  // itself can't run, a legitimate submission is never blocked because
  // of it.
  const recentCount = await countRecentInquiriesByEmail(supabase, request.businessEmail);
  if (recentCount >= RATE_LIMIT_MAX_PER_HOUR) {
    return { status: 429, body: { error: "Please wait a little before submitting again." } };
  }

  // Persist first, notify second — the brief's own ordering. A
  // notification failure below must never undo or hide a successful
  // persist.
  const result = await createInquiry(supabase, request);
  if (!result.ok) {
    return { status: 400, body: { error: result.reason } };
  }

  try {
    await getNotificationProvider().notifyNewInquiry({
      inquiryId: result.data.id,
      inquiryType: request.inquiryType,
      name: request.name,
      businessEmail: request.businessEmail,
      company: request.company ?? null,
    });
  } catch {
    // Deliberately swallowed — persistence already succeeded, which is
    // the part that actually matters. See ResendNotificationProvider's
    // own comment: it throws on failure precisely so this layer, not
    // the provider, decides that a notification failure is non-fatal.
  }

  return { status: 200, body: { id: result.data.id } };
}
