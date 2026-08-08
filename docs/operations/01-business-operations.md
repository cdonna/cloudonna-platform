# Business Operations — Inquiry System & Founder Dashboard

What this sprint actually built: a real, deployable inquiry backend replacing every simulated contact/lead-capture flow on the public site, plus an internal dashboard to see and manage what comes in. Everything below is either shipped and working today, or explicitly marked as an open action for the founder — nothing here describes a capability as live that isn't.

## What's real today

- **Persistence:** every inquiry submitted through `/contact`, `/early-access`, or the homepage Founding Testers section is validated server-side (Zod, `apps/web/src/lib/inquiries/schema.ts`) and written to a real `inquiries` table (`supabase/migrations/20260809090000_inquiries.sql`), protected by RLS — public INSERT, staff-only SELECT/UPDATE, no DELETE policy for anyone.
- **Confirmation state:** the form shows a real success state after a real write succeeds — not a `setTimeout` fake, the way the previous `EarlyAccess` component worked.
- **One backend, no duplicates:** `InquiryForm` (`apps/web/src/components/landing/InquiryForm.tsx`) is the only form implementation. `/contact` picks a type via a selector; `/early-access` redirects into it (old `?type=` values remapped); the homepage embeds it directly for `founding_tester`.
- **Founder Dashboard:** `/app/founder`, gated by a new `is_platform_staff()` RLS predicate — summary counts (new leads, by type, countries) plus a full inquiry table with status/owner/response-required.

## What's NOT real yet — do not treat these as live

- **Notification email.** `FOUNDER_CONTACT_EMAIL` is read (`apps/web/src/lib/notifications/config.ts`) but nothing sends an email — `ConsoleNotificationProvider` only logs server-side. No email provider (Resend, Postgrid, SES, etc.) is chosen, no API key exists, no dependency was added. Persistence works regardless; the "someone gets pinged" part does not, yet.
- **Analytics / visitor intelligence.** `apps/web/src/lib/analytics/` is a real, typed seam (`AnalyticsProvider`) with a no-op implementation. No Google Analytics, Plausible, PostHog, Clarity, or visitor-intelligence script is loaded anywhere on the site.

## Open founder decisions

1. **Seed the first platform staff member.** `platform_staff` is empty by design — insert a row manually (`insert into platform_staff (user_id) values ('<your auth.users id>');`) once you have a real account. Nothing in the app can do this for you; it's a deliberate no-self-escalation boundary.
2. **Pick a notification provider.** Recommend Resend (simplest Vercel-native option, no infra) once `FOUNDER_CONTACT_EMAIL` is set — but that's a provider/pricing decision, not a technical one, so it wasn't made unilaterally here.
3. **Decide on spam/abuse protection for the public inquiry endpoint.** `/api/inquiries` has no rate limiting or CAPTCHA today — DB constraints (`inquiries_name_not_blank`, email format) and Zod validation are the only current defenses. Fine for a low-traffic Public Alpha; worth revisiting before a marketing push.

## Legal & privacy accuracy

`/privacy` was rewritten to describe this real system accurately (previously it said "nothing you enter leaves your browser," which became false the moment this shipped). `/imprint` now explicitly lists the still-missing legal fields (entity, address, VAT, etc.) rather than inventing them. See those pages directly — this doc doesn't duplicate their content.
