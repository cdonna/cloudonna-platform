import { z } from "zod";

/** Matches the `inquiry_type` Postgres enum after
 * supabase/migrations/20260809120000_inquiries_taxonomy_refinement.sql
 * — the original 6-value taxonomy (founding_tester/enterprise_pilot/
 * customer/partner/vendor/general) collapsed enterprise_pilot and
 * customer into a single `enterprise`. */
export const inquiryTypeSchema = z.enum(["founding_tester", "enterprise", "partner", "vendor", "general"]);

export type InquiryType = z.infer<typeof inquiryTypeSchema>;

/** The known set of pages allowed to submit an inquiry — "supported
 * source page" validation from Phase 3 of the brief. An arbitrary
 * string here would just be uncontrolled free text in a field the
 * Founder Dashboard displays; a closed set keeps it meaningful. */
export const sourcePageSchema = z.enum(["/", "/contact", "/early-access", "/for-vendors", "/for-partners"]);

/** The full POST /api/inquiries request body. Every field beyond the
 * required minimum (type, name, email) is optional — a general contact
 * inquiry has no reason to demand a company or role. `message` is
 * capped, not because longer messages are unsafe, but because an
 * unbounded text field on a public, unauthenticated INSERT endpoint is
 * an easy denial-of-storage vector.
 *
 * `website` is a honeypot, not a real field — a legitimate visitor
 * never sees or fills it (hidden via CSS in InquiryForm), so any
 * non-empty value here is a near-certain bot. The handler checks it
 * and returns a fake success without persisting anything, rather than
 * rejecting outright (which would just teach the bot to adapt).
 */
export const createInquiryRequestSchema = z
  .object({
    inquiryType: inquiryTypeSchema,
    name: z.string().trim().min(1).max(200),
    businessEmail: z.string().trim().email().max(320),
    company: z.string().trim().max(200).optional(),
    role: z.string().trim().max(200).optional(),
    country: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(50).optional(),
    message: z.string().trim().max(4000).optional(),
    sourcePage: sourcePageSchema,
    utmSource: z.string().trim().max(200).optional(),
    utmMedium: z.string().trim().max(200).optional(),
    utmCampaign: z.string().trim().max(200).optional(),
    referrer: z.string().trim().max(500).optional(),
    website: z.string().max(200).optional(),
  })
  .strict();

export type CreateInquiryRequest = z.infer<typeof createInquiryRequestSchema>;
