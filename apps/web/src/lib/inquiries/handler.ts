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
import { createInquiry } from "./repository";
import { getNotificationProvider } from "../notifications/config";

export interface CreateInquiryHandlerResult {
  status: number;
  body: { id: string } | { error: string };
}

export async function handleCreateInquiryRequest(
  rawBody: unknown,
  supabase: SupabaseClient,
): Promise<CreateInquiryHandlerResult> {
  const parsed = createInquiryRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { status: 400, body: { error: "Please check the form for missing or invalid fields." } };
  }
  const request = parsed.data;

  const result = await createInquiry(supabase, request);
  if (!result.ok) {
    return { status: 400, body: { error: result.reason } };
  }

  // Best-effort: a notification failure never fails the request — the
  // inquiry is already durably stored by this point, which is the part
  // that actually matters. See ConsoleNotificationProvider's own
  // comment for what "notify" means until a real provider is
  // configured.
  try {
    await getNotificationProvider().notifyNewInquiry({
      inquiryId: result.data.id,
      inquiryType: request.inquiryType,
      name: request.name,
      businessEmail: request.businessEmail,
      company: request.company ?? null,
    });
  } catch {
    // Deliberately swallowed — see comment above.
  }

  return { status: 200, body: { id: result.data.id } };
}
