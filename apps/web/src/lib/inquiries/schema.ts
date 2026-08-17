import { z } from "zod";
// Relative, not "@/..." — no path-alias resolution is configured in
// vitest.config.mts, and this module needs to be importable directly
// from a plain Vitest test (same reasoning as login/metadata.ts).
import { SUPPORTED_LOCALES } from "../../i18n/locales";

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
 * Founder Dashboard displays; a closed set keeps it meaningful.
 *
 * Every page InquiryForm renders on now lives under the locale-prefixed
 * route group (src/app/(localized)/[locale]/), so the browser's real
 * pathname is always locale-prefixed (e.g. "/en/contact", never bare
 * "/contact") — InquiryForm.tsx correctly sends whatever
 * window.location.pathname actually is; this schema previously only
 * accepted the pre-localization unprefixed shape, silently rejecting
 * every real Production submission. Generated from SUPPORTED_LOCALES
 * (the single source of truth for supported locales) rather than a
 * second hardcoded list, so it can't drift out of sync the same way
 * again if a locale is ever added or removed. Bare, unprefixed values
 * are kept too — harmless, and matches what a direct API caller or a
 * locale-less environment could still send. */
const INQUIRY_SOURCE_PAGES = ["/", "/contact", "/early-access", "/for-vendors", "/for-partners"] as const;

const LOCALIZED_INQUIRY_SOURCE_PAGES = SUPPORTED_LOCALES.flatMap((locale) =>
  INQUIRY_SOURCE_PAGES.map((page) => (page === "/" ? `/${locale}` : `/${locale}${page}`)),
);

export const sourcePageSchema = z.enum([...INQUIRY_SOURCE_PAGES, ...LOCALIZED_INQUIRY_SOURCE_PAGES] as [string, ...string[]]);

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
