import "server-only";

/**
 * Lead -> Opportunity promotion (brief §50) — a qualified inquiry
 * becomes an Account, a Contact, and an Opportunity without manual
 * retyping, but never automatically: this handler only runs when a
 * staff member explicitly calls it for one specific inquiry. No
 * inquiry is ever auto-promoted on submission or on a schedule.
 *
 * `accountId` in the request attaches the opportunity to an existing
 * account (the common case for a second inquiry from a known
 * company); omitting it creates a new account from the inquiry's own
 * self-reported company name — never inferred or guessed from the
 * email domain.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { promoteInquiryRequestSchema } from "../schema";
import { createCommercialAccount, createCommercialOpportunity, type CommercialOpportunitySummary } from "../repository";
import { createCommercialContact } from "../contacts-repository";
import { getInquiryById } from "../../inquiries/repository";
import { logCommercialEvent } from "../events";

export interface PromoteInquiryHandlerResult {
  status: number;
  body: CommercialOpportunitySummary | { error: string };
}

export async function handlePromoteInquiryRequest(rawBody: unknown, supabase: SupabaseClient, userId: string | null): Promise<PromoteInquiryHandlerResult> {
  if (!userId) return { status: 401, body: { error: "Sign in to promote an inquiry." } };

  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return { status: 403, body: { error: "This area is restricted to ClouDonna platform staff." } };

  const parsed = promoteInquiryRequestSchema.safeParse(rawBody);
  if (!parsed.success) return { status: 400, body: { error: "The request could not be processed." } };

  const inquiryResult = await getInquiryById(supabase, parsed.data.inquiryId);
  if (!inquiryResult.ok) return { status: 404, body: { error: inquiryResult.reason } };
  const inquiry = inquiryResult.data;

  let accountId = parsed.data.accountId;
  if (!accountId) {
    const accountResult = await createCommercialAccount(supabase, { name: inquiry.company ?? inquiry.name, country: inquiry.country ?? undefined, source: inquiry.sourcePage ?? undefined });
    if (!accountResult.ok) return { status: 400, body: { error: accountResult.reason } };
    accountId = accountResult.data.id;
  }

  const contactResult = await createCommercialContact(supabase, { accountId, name: inquiry.name, email: inquiry.businessEmail, phone: inquiry.phone ?? undefined });
  if (!contactResult.ok) return { status: 400, body: { error: contactResult.reason } };

  const opportunityResult = await createCommercialOpportunity(supabase, {
    accountId,
    primaryContactId: contactResult.data.id,
    inquiryId: inquiry.id,
    commercialPackage: parsed.data.commercialPackage,
    useCase: inquiry.decisionType ?? undefined,
    decisionValueChf: inquiry.investmentAtStakeChf ?? undefined,
    source: inquiry.sourcePage ?? undefined,
    notes: inquiry.message ?? undefined,
  });
  if (!opportunityResult.ok) return { status: 400, body: { error: opportunityResult.reason } };

  await logCommercialEvent(supabase, "inquiry_qualified", { commercialPackage: parsed.data.commercialPackage });

  return { status: 200, body: opportunityResult.data };
}
