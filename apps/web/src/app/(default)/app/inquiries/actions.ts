"use server";

/**
 * The one mutation this inbox supports — status changes, nothing else.
 * See docs/operations/05-inquiry-system-v2.md, "This is an inbox,
 * nothing more" — no owner assignment, no notes, no automation.
 */
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateInquiryStatus, VALID_STATUSES, type InquiryStatus } from "@/lib/inquiries/repository";

export async function updateInquiryStatusAction(inquiryId: string, status: string): Promise<{ error: string | null }> {
  if (!VALID_STATUSES.includes(status as InquiryStatus)) {
    return { error: "Invalid status." };
  }

  const supabase = await createSupabaseServerClient();
  // RLS (inquiries_update_staff) is the real enforcement — a non-staff
  // caller updates zero rows, not something this action needs to check
  // for itself first.
  const result = await updateInquiryStatus(supabase, inquiryId, status as InquiryStatus);

  if (!result.ok) {
    return { error: result.reason };
  }

  revalidatePath("/app/inquiries");
  return { error: null };
}
