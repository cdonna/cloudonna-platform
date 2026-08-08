# Inquiry System v2 — Refinement

Supersedes the taxonomy/field list in `docs/operations/01-business-operations.md` (kept for history, not rewritten). This is the authoritative shape going forward.

## What changed from v1

- **Taxonomy:** `founding_tester / enterprise_pilot / customer / partner / vendor / general` (6) → `founding_tester / enterprise / partner / vendor / general` (5). `enterprise_pilot` and `customer` collapsed into one `enterprise` type.
- **Status vocabulary:** `new / in_review / responded / closed / spam` → `new / reviewing / contacted / qualified / closed`.
- **Fields:** added `utm_medium`; dropped `owner` and `notes` — not in the finalized field list, and the internal view (`/app/inquiries`, renamed from `/app/founder`) is explicitly "an inbox, nothing more," not a CRM with assignment.
- **Security:** added a honeypot field (`website`, hidden via CSS, silently faked-success if filled — never persisted) and a simple DB-backed rate limit (max 3 submissions per email per hour), enforced through a narrow security-definer function (`count_recent_inquiries_by_email`) that returns a count only, never rows — anon still has zero SELECT access to the table itself.
- **Notification:** a real `ResendNotificationProvider` now exists (plain `fetch()`, no new npm dependency), selected only when both `RESEND_API_KEY` and `FOUNDER_CONTACT_EMAIL` are set. Neither is set anywhere this codebase has run, so `ConsoleNotificationProvider` is still what's active — it now logs the exact two-line signal the brief asked for: `INQUIRY STORED` and `FOUNDER EMAIL NOT CONFIGURED`.
- **Internal view:** moved to `/app/inquiries` (was `/app/founder`), and now supports changing an inquiry's status inline (the one mutation the brief asked for) via a Server Action, gated by the same `is_platform_staff()` RLS predicate as the read.
- **Analytics:** `apps/web/src/lib/analytics/` moved from a no-op stub to a real, first-party implementation — writes to a new `business_events` table (our own Postgres, nothing external), firing the six named events (`contact_viewed`, `inquiry_started`, `inquiry_submitted`, `founding_tester_submitted`, `partner_inquiry_submitted`, `vendor_inquiry_submitted`). No visitor identity of any kind is captured — no name, email, IP, or session id, just the event, its page, and the time.

## Migration note

`supabase/migrations/20260809120000_inquiries_taxonomy_refinement.sql` recreates the two enums and migrates the column in place — safe because the original migration was never applied to a live database (disclosed since Sprint 6.2 Slice C: no local Postgres available all sprint). There is no real data to migrate, only the shape to correct before this is ever applied for real.
