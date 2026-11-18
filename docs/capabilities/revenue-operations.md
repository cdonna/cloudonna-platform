# Capability: Revenue Operations & First Customer Engine V1

**Branch:** `agent/revenue-operations-first-customer-v1`. Turns Commercial Engine V1's planning model into an operational system for running real enterprise deals: contract economics, Decision Sprint delivery, Sprint→Team→Enterprise conversion, cash collection, pipeline hygiene, and customer outcome learning.

## A. Audit — what already existed, what this sprint adds

Commercial Engine V1 shipped `commercial_accounts`/`commercial_contacts`/`commercial_opportunities` (platform-staff-only), a stage-based pipeline model, a planning-only CHF 1,025,000 scenario, and `/app/commercial` as a single read-only summary. It had no contract economics, no Decision Sprint delivery tracking, no conversion history, no cash collection, no pipeline hygiene, and no customer outcome learning — all genuinely new in this sprint, not a rebuild of anything that existed.

## B-E. Account / Contact / Opportunity V2 / Contract models

- `commercial_accounts` gained `country`, `company_size`, `source`, `icp_fit`, `status` (PROSPECT/ACTIVE_OPPORTUNITY/CUSTOMER/EXPANSION/INACTIVE), `owner` — additive, every existing row defaults to `status = 'prospect'`.
- `commercial_contacts` gained `buyer_persona` (CIO/CTO/CDO/Chief AI Officer/CFO/Enterprise Architect/Head of Data/Head of AI/Transformation Leader/Procurement/Technology Strategy/Other) and five boolean buying-role flags (economic buyer, decision maker, technical evaluator, champion, procurement). `buyer_persona` is GTM reporting only — the neutrality firewall tests fail the build if any file under `components/donna-ai/` ever imports it.
- `commercial_opportunities` gained `currency`, `planning_value_chf` (a staff-approved CHF equivalent for a non-CHF deal — never a computed FX rate), `decision_title`, `decision_deadline` (the customer's own deadline, distinct from `target_close_date`), `expected_bookings_chf`, `expected_arr_chf`, `forecast_category`, `lost_reason`/`lost_reason_note`, `won_reason`/`won_reason_note`, `closed_at`, `stage_changed_at`.
- `commercial_contracts` (new, one row per opportunity): term dates, billing frequency, one-time/services/recurring fees in the contract's own currency, discount percent, contract status, and `computed_bookings_chf`/`computed_arr_chf`/`computed_tcv_chf` — recomputed by the application layer on every write, never hand-edited.

## F-H. Bookings, ARR, TCV — kept genuinely distinct

`apps/web/src/lib/commercial/contract-economics.ts` is the single deterministic source: **ARR** = recurring annual fee only, net of discount (a one-time Decision Sprint always contributes exactly zero). **Bookings** = one-time + services + ONE year of recurring fee — the value attributable to the signing period, deliberately not the full multi-year commitment. **TCV** = one-time + services + recurring × term years. A 3-year, CHF 75k/year Team contract plus a CHF 25k one-time setup fee books CHF 100k, carries CHF 75k ARR, and totals CHF 250k TCV — three different, auditable numbers, matching the brief's own worked example. Bookings/ARR/TCV only ever roll up in CHF; a non-CHF signed contract with no approved `planning_value_chf` is excluded from the dashboard total and the exclusion count is surfaced, never silently guessed.

## I-J. Recognized revenue & cash collection

Bookings/ARR/TCV are recognized only for contracts with `contract_status` SIGNED or ACTIVE — DRAFT/PROPOSED/EXPIRED/CANCELLED never count, and pipeline/weighted-pipeline/bookings stay three strictly separate numbers (`pipeline-model.ts`, unchanged from V1). `commercial_invoices` (new) tracks invoice amount, paid amount, due/paid dates, and a payment status (NOT_INVOICED/INVOICED/PARTIALLY_PAID/PAID/OVERDUE) resolved deterministically from paid-vs-invoice amount — no Stripe integration, manual entry only.

## K-N. Decision Sprint operations, onboarding, outcome capture, conversion

`decision_sprints` (new) tracks one real delivery engagement per account: scope, dates, status (SCOPING→COMMITTED→ACTIVE→EVIDENCE_GATHERING→ANALYSIS→EXECUTIVE_REVIEW→COMPLETED/ON_HOLD/CANCELLED), executive sponsor, working team, commercial value, outputs, follow-up action. `decision_sprint_outcomes` (new, one row per sprint) captures the recommendation delivered, the final human decision, whether the customer accepted the recommendation or chose a different option — modeled as a normal, valuable outcome, never a failure flag — reasons, next step, and expansion potential. `commercial_conversions` (new) records a real Sprint→Team / Team→Enterprise / no-expansion / follow-up-sprint outcome once staff know it; nothing here is ever auto-generated. Team→Enterprise *candidates* are surfaced separately and read-only by `expansion-signals.ts`, computed from real distinct-decision/executive-stakeholder/completed-sprint counts — a recommendation for human review, never an auto-created opportunity.

## O-Q. Pipeline hygiene, sales velocity, conversion funnel

`pipeline-hygiene.ts` flags nine real conditions (no next action, overdue next action, past close date, no primary contact, no expected value, no use case, stale stage >30 days, missing economic buyer, missing decision deadline) against open opportunities only — warnings, never an auto-close. `sales-velocity.ts` derives real inquiry→qualified→proposal→signed→sprint-start→completion→expansion day counts from `commercial_activities`' logged stage-change history (never a database trigger — the repository logs this explicitly on every real stage change) and from zero and one data point, reports "insufficient data" rather than a fabricated average. `funnel.ts` computes real counts and conversion rates per stage, correctly crediting a closed-lost deal with every stage it actually reached via the same activity log, rather than collapsing it to zero progress.

## R-T. Forecast model, First CHF 1M Control Panel, scenario planning

`forecast.ts` adds an optional PIPELINE/UPSIDE/COMMIT category — a human sales judgment, never derived from probability or stage. `/app/commercial` is rebuilt around `revenue-position.ts`, which composes every module above into one summary: real signed bookings/ARR/TCV/cash collected, pipeline/weighted-pipeline/coverage/gap, Decision Sprint active/completed counts, conversion counts, delivery-capacity status (`capacity.ts`, a documented 2-concurrent-sprint assumption), top open opportunities, hygiene issues, next actions due, the conversion funnel, sales velocity, and the BASE/UPSIDE/DOWNSIDE scenario comparison (`scenario-planning.ts`) — three deterministic, editable scenarios, never presented as a forecast.

## U-W. Admin UI, account/opportunity linking

`/app/commercial/accounts` (list + create), `/app/commercial/accounts/[id]` (summary, contacts, open/closed opportunities, signed contracts' bookings/ARR/TCV, Decision Sprints, conversions, expansion-signal banner, customer reference permissions), `/app/commercial/opportunities/[id]` (stage/forecast/next-action/won-lost editing, contract terms, invoices, activity log), `/app/commercial/sprints` and `/app/commercial/sprints/[id]` (status, outcome capture, conversion recording) — all platform-staff-only, all built on server actions that call the same `handle*Request` functions the REST API under `/api/commercial/*` uses, so validation and business logic are never duplicated between the two surfaces.

## X-Y. Customer outcome learning & business case actuals

`decision_outcomes`, `business_case_actuals`, and `assumption_validations` (all new) are **tenant-scoped** (`is_org_member()`), not platform-staff — this is the customer's own private decision outcome data, structurally separate from every commercial table above. `assumption_validations` is a many-rows-per-decision table (CONFIRMED/INVALIDATED/PARTIALLY_TRUE/UNKNOWN); `decision_outcomes`' own "assumptions validated/invalidated" concept is deliberately *not* duplicated as a stored field — it is a derived count over that table, computed at read time. `business_case_actuals` holds estimated vs. actual cost/benefit, entered only by the customer's own organization, never pre-filled or invented.

## Z. Customer reference permissions

`commercial_customer_references` (new, one row per account) defaults to PRIVATE with every `allow_*` flag false — no public use of any kind — until a staff member explicitly records the customer's consent (anonymous stats / public reference / logo / case study / quote).

## AA. Neutrality firewall V2

`commercial-neutrality-firewall.test.ts` gained four assertions on top of V1's: no file under `donna-ai/` imports `buyer-persona.ts`; no file under `donna-ai/` imports anything from `lib/decision-outcomes/`; `lib/commercial/` and `lib/decision-outcomes/` never import from each other (the staff-sales/tenant-outcome separation, enforced structurally); no file under `lib/decision-outcomes/` imports the scoring engine or vendor-intelligence catalog.

## AB. Security / RLS

Every new staff-only table (`commercial_contracts`, `commercial_invoices`, `decision_sprints`, `decision_sprint_outcomes`, `commercial_conversions`, `commercial_customer_references`) carries an `is_platform_staff()`-gated `for all` policy, matching V1's existing tables exactly. `commercial_activities` has no update/delete policy for any role — genuinely append-only, same discipline as the pre-existing `audit_logs` table (deliberately not reused directly: `audit_logs.actor_user_id` references the legacy, pre-auth `users` table, not the auth-linked `profiles` table every commercial write actually has an identity in). `decision_outcomes`/`business_case_actuals`/`assumption_validations` carry `is_org_member()` policies, the same tenant posture as `decisions`/`decision_versions`.

## AD. Migration safety

Two migrations: `20261119000000_revenue_operations_first_customer_v1.sql` (every new table/type/column) and `20261119010000_revenue_operations_funnel_events.sql` (eight additive `business_event_name` enum values). Every new table and type name was checked against every prior migration file for a collision before being written — the direct lesson from the Vendor Intelligence & Evidence Graph V1 migration's `evidence_sources` collision, which silently rolled back that entire migration in production. Both migrations were verified live via direct `supabase db query` against `information_schema`/`pg_proc`/`pg_trigger`/`pg_policies`, not migration bookkeeping or PostgREST introspection.

## Known limitations

- Sales velocity and the conversion funnel are only as complete as the logged `commercial_activities` stage-change history going forward — no retroactive history exists for opportunities created before this sprint.
- `expansion-signals.ts` computes three of the brief's six listed Team→Enterprise signals (multiple decisions, multiple executive stakeholders, multiple completed sprints) from real data; governance requirement and cross-team standardization need are real signals a human notices in conversation, not something this schema tracks structurally — deliberately not faked.
- CSV export covers the open/closed opportunity list only (brief §42's "cheap and secure" bar), not a full data dump.
