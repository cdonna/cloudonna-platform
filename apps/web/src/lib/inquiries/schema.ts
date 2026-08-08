import { z } from "zod";

/** Matches the `inquiry_type` Postgres enum in
 * supabase/migrations/20260809090000_inquiries.sql exactly. */
export const inquiryTypeSchema = z.enum([
  "founding_tester",
  "enterprise_pilot",
  "customer",
  "partner",
  "vendor",
  "general",
]);

export type InquiryType = z.infer<typeof inquiryTypeSchema>;

/** The full POST /api/inquiries request body. Every field beyond the
 * required minimum (type, name, email) is optional — a general contact
 * inquiry has no reason to demand a company or role. `message` is
 * capped, not because longer messages are unsafe, but because an
 * unbounded text field on a public, unauthenticated INSERT endpoint is
 * an easy denial-of-storage vector. */
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
    sourcePage: z.string().trim().max(300).optional(),
    utmSource: z.string().trim().max(200).optional(),
    utmCampaign: z.string().trim().max(200).optional(),
    referrer: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreateInquiryRequest = z.infer<typeof createInquiryRequestSchema>;
