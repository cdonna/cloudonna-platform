# Capability: Commercial Engine V1

**Branch:** `agent/commercial-engine-first-million`. Builds the commercial system connecting Website → Lead → Qualified Decision → Decision Sprint → Team → Enterprise → Expansion, targeting ClouDonna's first CHF 1,000,000 in contracted bookings.

## A. Audit — what already existed

- **`inquiries`** (public lead inbox): `inquiry_type` (founding_tester/enterprise/partner/vendor/general), name/email/company/role/country/phone/message, source_page + UTM fields, status workflow (new→reviewing→contacted→qualified→closed). Explicitly "an inbox, nothing more" per its own migration comments — no stage, no value, no owner, no product link. Correct for what it is; not a revenue model.
- **`InquiryForm`/`/api/inquiries`**: one implementation, every public contact surface, honeypot + rate limiting, first-party notification on submit.
- **`CommercialPaths`**: a 3-tier grid (Sprint/Team/Enterprise) already existed, routed to `/contact` with no price shown at all — a deliberate choice from an earlier phase, now superseded by this brief's explicit instruction to show indicative "starting from" pricing.
- **`business_events`**: first-party, anonymous, six named events (contact_viewed, inquiry_started, inquiry_submitted, founding_tester_submitted, partner_inquiry_submitted, vendor_inquiry_submitted).
- **`billing_foundation`** (plans/entitlements/subscriptions/billing_customers): real schema, zero live pricing, `is_purchasable: false` on every plan pending a separate Commercial Activation approval — a **different, lower-level concern** (actual Stripe/invoice billing) from this sprint's commercial/sales model. Left completely untouched.
- **`organizations`**: live product tenancy (auth, RLS, decisions). Explicitly NOT the same thing as a sales prospect/account — a prospect has no `organizations` row until they actually sign up.
- **`/app/inquiries`**: the existing staff-gated inbox UI pattern (`is_platform_staff()` RPC check), reused verbatim for `/app/commercial`.
- **Decision Engine / Business Case Engine / Research Agent / Decision Memory / Vendor Intelligence**: all live, all referenced accurately in the new commercial copy and packages — nothing claimed that isn't shipped.

## B. Package model

Single TypeScript source of truth (`apps/web/src/lib/commercial/packages.ts`) feeds both the website copy's underlying facts and the sales playbook/proposal template — not duplicated independently in three places. Four packages: Decision Sprint, Team, Enterprise, Strategic Decision Program.

## C. Decision Sprint

Starting from CHF 25,000, 2–4 weeks, one strategic decision. Outputs are an exact list of already-shipped capabilities (decision context, evidence, Vendor Intelligence, research, constraints, business case, TCO/ROI/NPV, scenarios, sensitivity, Challenger review, Executive Recommendation, Decision Record, executive brief) — nothing on the list is a roadmap promise.

## D. Team

From CHF 75,000/year. Shared Decision Workspace, multiple decisions, multiple users, Decision Memory, Research/Business Case/Scenario/Challenger tooling, shared Vendor Intelligence, team governance, onboarding. No invented usage limits (e.g. "up to N decisions/month") — the brief explicitly warned against inventing limits without product justification, and none currently exists.

## E. Enterprise

No public fixed price — "Talk to ClouDonna" only. Multiple teams, decision governance/RBAC, organization-private evidence kept separate from shared vendor knowledge, enterprise-scale Decision Memory, enterprise reporting, a security review before rollout. Future SSO/connectors are named as future, never claimed live.

## F. Strategic Decision Program

CHF 300,000–750,000+, sales-led, internal positioning only — not a homepage pricing card, not hardcoded into any deterministic product logic (`packages.ts`'s own `STRATEGIC_DECISION_PROGRAM` constant is read only by the sales playbook and the dashboard's package breakdown, never by the Decision Engine).

## G. Website changes

- `CommercialPaths.tsx`: now shows real indicative pricing per tier, outcome-language taglines, a value-proposition statement ("before committing millions..."), and funnel-tracking events — reworked from a no-price, generic-CTA grid.
- Four "reaches a founder directly" / "a founder will follow up" instances (the exact phrasing the brief warned about, found in `/contact`'s Enterprise/General copy and the old `commercialSection.body`, across all 5 locales — 20 total strings) replaced with "the ClouDonna team" throughout.
- `InquiryForm.tsx`: two new inquiry types (`decision_sprint`, `team`) with their own qualification copy, and four new progressive qualification fields (decision type, decision timeframe, investment at stake, current platforms) shown only for the three commercial inquiry types.

## H. Commercial landing page

`/commercial` (all 5 locales) — the enterprise-sales-led landing page, not a consumer pricing table. Decision Sprint gets the full seven-question treatment (brief §22); Team and Enterprise are summarized, consistent with how `CommercialPaths` already introduces them. Added to the sitemap, `LOCALIZED_PATH_PREFIXES`, and the footer.

## I. Pricing positioning

Every price is "starting from" / "from" language, never "fixed price," for Decision Sprint and Team. Enterprise and the Strategic Decision Program show no number at all — "Talk to ClouDonna" is the honest answer. No self-service checkout exists or was added; `billing_foundation`'s purchase gate remains untouched and closed.

## J. Lead qualification

Four new, optional, nullable columns on `inquiries` (decision_type, decision_timeframe, investment_at_stake_chf, current_platforms), shown only for the three commercial inquiry types — the existing short-form stays short for founding_tester/partner/vendor/general. Every qualification value is the lead's own self-report, never inferred.

## K. Commercial data model

Three new tables, not a CRM rebuild: `commercial_accounts` (prospect/customer company, distinct from `organizations`), `commercial_contacts` (a person at that account), `commercial_opportunities` (the actual pipeline record — package, stage, decision value, expected ACV/TCV, probability, source, next action, target close date, and an optional link to a real `decisions` row). `CommercialPackage`/`OpportunityStage`/`Source` are enums/text, not separate lookup tables — they carry no attributes of their own.

## L. Pipeline model

`apps/web/src/lib/commercial/pipeline-model.ts` — pipeline value (open opportunities' expected TCV, falling back to ACV), weighted pipeline (× explicit or stage-default probability, never a scientific prediction), and a conventional coverage ratio (pipeline ÷ remaining gap to target). `target-model.ts` keeps Bookings/ARR/TCV genuinely separate: a one-time Decision Sprint contributes zero ARR by construction; only Team/Enterprise's recurring annual contracts do.

## M. CHF 1M plan

`DEFAULT_FIRST_MILLION_SCENARIO` reproduces the brief's own worked example exactly (10×25k + 5×75k + 2×200k = CHF 1,025,000), as a plain, editable assumptions array — never a hardcoded total.

## N. Commercial dashboard

`/app/commercial`, platform-staff-only (same `is_platform_staff()` RPC-check pattern as `/app/inquiries`). Shows target, booked, ARR, pipeline, weighted pipeline, coverage, an on-track-for-target verdict, a per-package open/closed-won breakdown, and the open-opportunity list with its decision-value/expected-TCV/next-action/linked-decision columns. Never public.

## O. Decision / opportunity linking

`commercial_opportunities.decision_id` references `decisions` directly — the product-led-sales history the brief names (e.g. "SAP BDC vs Databricks vs Microsoft Fabric vs Hybrid" as the linked decision for an "Enterprise Data Platform Strategy" opportunity). Read-only context for sales; see the neutrality firewall below for why this link can never flow the other direction.

## P. Neutrality firewall

Two structural guarantees, both regression-tested (`engine/__tests__/commercial-neutrality-firewall.test.ts`):

1. No file under the Decision Engine (`donna-ai/`) imports anything from `lib/commercial/`, and no file under `lib/commercial/` imports from the scoring engine or vendor-intelligence catalog — proven by a static source scan, not just asserted in a comment.
2. `scoreAllPlatformsV2`'s own signature has exactly one parameter (`state: WizardState`) — there is structurally nowhere for a commercial fact (opportunity value, package type, customer status, pipeline stage) to enter the scoring call even if a caller tried.

## Q. Sales playbook

`docs/commercial/first-million-playbook.md` — ICP, buyer personas, trigger events, sales discovery framework, Decision Sprint/Team/Enterprise expansion triggers, objection handling, packaging reference, pipeline math. No personal founder information.

## R. Proposal template

`docs/commercial/decision-sprint-proposal.md` — ten sections (Decision, Business context, Scope, Outputs, Approach, Timeline, Commercials, Customer responsibilities, ClouDonna responsibilities, Next steps), explicitly not a legal contract.

## S. Executive one-pager

`docs/commercial/cloudonna-executive-one-pager.md` — the four-capability Enterprise Decision Intelligence framing, the three commercial entry points, and a founder-led (never named) company description.

## T. Internationalization

All new copy (CommercialPaths rework, the four qualification fields, two new InquiryForm `copyByType` entries, the full `/commercial` page) translated natively into German, French, Spanish and Italian — not literal/machine translations, consistent with `docs/content/terminology-glossary.md`'s existing standards (e.g. German keeps "Governance"/English product names where already established; French distinguishes "éditeur" from "fournisseur"). Dictionary parity verified across all 5 locales.

## U. SEO

`/commercial` added to the sitemap (priority 0.8, matching other high-intent commercial pages) and the bare-URL-to-locale redirect allowlist, with its own per-locale metadata (`commercialPage.metaTitle`/`metaDescription`) targeting "pricing," "Decision Sprint," and "enterprise technology decision" intent without keyword-stuffing.

## V. Privacy

Four "reaches a founder directly"/"a founder will follow up" instances removed across all 5 locales (20 strings total) — the exact pattern the brief named as a known issue. The founder-privacy regression test (`src/app/__tests__/founder-privacy.test.ts`, from the prior Website Perfection phase) passes against every dictionary including the new commercial copy, with no changes needed to the test itself (it already scans every dictionary string generically).

## W. Security

`commercial_accounts`/`commercial_contacts`/`commercial_opportunities` are RLS-gated to `is_platform_staff()` only — the identical posture as `inquiries`/`platform_staff`, never `is_org_member()` (this is not tenant data). Every new API handler checks `is_platform_staff()` explicitly before any write, rather than relying solely on RLS to fail silently. No commercial pipeline data is reachable from any public or tenant-authenticated route.

## X. Known limitations

- `target-model.ts`'s TCV calculation assumes single-year committed terms throughout; a real multi-year contract needs its own term-length field on the opportunity, which this V1 does not yet record.
- The Commercial Dashboard has no UI for editing the CHF 1M scenario's assumptions in place — they are genuinely editable in code (`target-model.ts`), not yet through an admin screen.
- No Decision Sprint → Team / Team → Enterprise *automated* conversion detection exists; the playbook's expansion triggers are sales-process guidance, not a product feature that flags a candidate automatically.
- `commercial_opportunities.probability_percent` and the stage-default table are both sales-planning heuristics, never validated against real historical close-rate data (none exists yet).

## Y. Next 5 commercial priorities

1. Seed the first real `commercial_accounts`/`commercial_opportunities` rows from the actual current pipeline, so the dashboard reflects reality rather than starting empty.
2. Build the admin UI for creating/editing opportunities directly (currently API-only, exercised via the dashboard's read path and a thin create/update API).
3. Record actual contract term length on an opportunity, so TCV genuinely differs from bookings for multi-year deals.
4. Track Decision Sprint → Team conversion as a real, queryable link (which accounts had a closed-won Sprint opportunity and later a Team opportunity), not just a playbook heuristic.
5. Revisit default stage probabilities once enough real closed-won/closed-lost history exists to sanity-check them against actuals.
