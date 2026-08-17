import "server-only";

/**
 * Framework-independent handler behind app/api/inquiries/route.ts —
 * same pattern as handle-save-decision-request.ts: testable with plain
 * objects, the route file stays a thin adapter. Deliberately takes no
 * userId/auth requirement — this is the one write path in the schema
 * that anonymous visitors are meant to use.
 *
 * Every branch below logs a structured, single-line event server-side
 * (console.log/warn/error — picked up by Vercel's own log capture,
 * nothing new to configure). Never logs: message content, name,
 * company, phone, notes, tokens, or credentials — only enough to
 * diagnose *where* a request failed, not *who* sent it or *what* they
 * said. The raw Postgres error message is logged here (server-only)
 * even though classifySupabaseError() still sanitizes what the client
 * receives — this is exactly the "acceptable for the visitor, not
 * acceptable as internal diagnosis" distinction.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createInquiryRequestSchema } from "./schema";
import { createInquiry, countRecentInquiriesByEmail } from "./repository";
import { getNotificationProvider } from "../notifications/config";

export interface CreateInquiryHandlerResult {
  status: number;
  // No `id` — createInquiry() can no longer read the inserted row back
  // (see repository.ts). InquiryForm.tsx never read the success body
  // anyway (confirmed by reading it — it only parses JSON on the error
  // branch), so this loses nothing the client actually used.
  body: { ok: true } | { error: string };
}

const RATE_LIMIT_MAX_PER_HOUR = 3;

function log(event: string, fields: Record<string, string | number | boolean | undefined> = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`);
  console.log(`[inquiries] ${event}${parts.length ? " " + parts.join(" ") : ""}`);
}

export async function handleCreateInquiryRequest(
  rawBody: unknown,
  supabase: SupabaseClient,
): Promise<CreateInquiryHandlerResult> {
  log("request_received");

  const parsed = createInquiryRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    log("validation_failed", { issueCount: parsed.error.issues.length });
    return { status: 400, body: { error: "Please check the form for missing or invalid fields." } };
  }
  const request = parsed.data;
  log("validation_passed", { inquiryType: request.inquiryType, sourcePage: request.sourcePage });

  // Honeypot: a real visitor never sees or fills this field (hidden via
  // CSS in InquiryForm). A filled value is a near-certain bot. Return a
  // fake success rather than a 400 — rejecting outright just teaches
  // the bot what to fix, silently accepting teaches it nothing while
  // storing nothing either.
  if (request.website) {
    log("honeypot_triggered");
    return { status: 200, body: { ok: true } };
  }

  // Simple, DB-backed rate limit — no new infrastructure, just the one
  // narrow security-definer count this schema already exposes. Fails
  // open (see countRecentInquiriesByEmail's own comment): if the check
  // itself can't run, a legitimate submission is never blocked because
  // of it.
  const recentCount = await countRecentInquiriesByEmail(supabase, request.businessEmail);
  log("rate_limit_checked", { recentCount });
  if (recentCount >= RATE_LIMIT_MAX_PER_HOUR) {
    log("rate_limit_exceeded");
    return { status: 429, body: { error: "Please wait a little before submitting again." } };
  }

  // Persist first, notify second — the brief's own ordering. A
  // notification failure below must never undo or hide a successful
  // persist.
  const result = await createInquiry(supabase, request);
  if (!result.ok) {
    // result.reason is already the sanitized, client-safe message —
    // logging it here too (server-only) is intentionally redundant
    // with the classifySupabaseError() call inside createInquiry(),
    // since that function has no logging of its own and the raw
    // Postgres message never leaves it. This is the one place that
    // gap is closed.
    log("database_insert_failed", { reason: result.reason });
    return { status: 400, body: { error: result.reason } };
  }
  log("database_insert_succeeded");

  try {
    await getNotificationProvider().notifyNewInquiry({
      inquiryId: null,
      inquiryType: request.inquiryType,
      name: request.name,
      businessEmail: request.businessEmail,
      company: request.company ?? null,
    });
    log("notification_succeeded");
  } catch (error) {
    // Deliberately swallowed as far as the HTTP response goes —
    // persistence already succeeded, which is the part that actually
    // matters. See ResendNotificationProvider's own comment: it throws
    // on failure precisely so this layer, not the provider, decides
    // that a notification failure is non-fatal. Still logged, so a
    // silent notification outage is visible without breaking anyone's
    // submission.
    log("notification_failed", { error: error instanceof Error ? error.message : "unknown" });
  }

  log("response_sent", { status: 200 });
  return { status: 200, body: { ok: true } };
}
