# Billing & Subscription Architecture

**Status: DESIGNED / NOT ACTIVE.** This document, the accompanying schema migration, and the accompanying code seams are the complete Phase 15 deliverable. No payment provider is contracted, no API keys exist anywhere in this repository, no checkout flow is reachable from the product, and no route can move real money. Everything below exists so that turning billing on later is a configuration and content change, not a redesign.

---

## 1. What already exists (inspected before writing anything)

Grepped the full repository for `stripe`, `billing`, `subscription`, `entitlement`: zero payment-provider dependencies, zero billing tables, zero `/app/settings` route, zero environment variables. The only hits were unrelated prose (TCO cost-modeling copy in the Donna AI demo, vendor pricing-model descriptions in the vendor catalog) and this session's own prior planning docs. Billing starts from nothing in this codebase — every seam below is new.

The one directly relevant piece of existing infrastructure is the tenancy model from Sprint 4/6.1 (`supabase/migrations/20260806120200_tenancy.sql`, `20260806130000_sprint6_1_profiles_and_bootstrap.sql`): `organizations` → `organization_members` (role: `owner`/`admin`/`member`/`viewer`) → `workspaces` → `projects`, with `is_org_member()`/`is_org_admin()` as the established RLS predicates, and a bootstrap trigger that gives every new signed-up user exactly one personal organization as `owner`. Billing hangs off `organization_id`, exactly like everything else in this schema — a subscription belongs to an organization, never to an individual user.

## 2. Recommended provider

**Stripe Billing + Stripe Checkout (or Payment Element) for self-service, Stripe Invoicing for enterprise.** This was specified as the preferred architecture to evaluate, and nothing in the codebase or commercial context argues against it: Stripe natively supports Apple Pay and Google Pay through the same integration (no separate wallet SDKs), has first-class Swiss/EU tax handling (Stripe Tax), supports multi-currency out of the box, and its Customer Portal removes the need to build invoice/payment-management UI in-house — directly matching the brief's "prefer the billing provider's secure customer portal initially" instruction. No alternative provider was evaluated in depth because none was requested and Stripe is the de facto standard this brief already named; if that changes, only the concrete adapter in §7 needs to be rewritten — the interface and everything above it stays the same.

## 3. Self-service flow

```
Choose Plan → Confirm Workspace → Pay → Subscription Activated → Workspace Ready
```

- **Choose Plan:** a plan-selection screen showing FOUNDING_ACCESS / PROFESSIONAL / TEAM as purchasable options (ENTERPRISE routes to the Talk to Sales flow instead, never to checkout — see §4). Until pricing is Founder-approved, every plan card shows **"Contact / Early Access"** instead of a number, per the explicit instruction not to expose invented prices.
- **Confirm Workspace:** since every user already has exactly one organization from the Sprint 6.1 bootstrap trigger, this step confirms *which* organization the subscription attaches to (relevant once multi-org support exists) rather than creating one.
- **Pay:** Stripe Checkout (redirect) or Payment Element (embedded) — both support Apple Pay/Google Pay natively when the device/browser/domain qualify (§6), and fall back cleanly to card entry otherwise, entirely inside Stripe's own UI. ClouDonna never renders its own card form.
- **Subscription Activated:** driven by the `checkout.session.completed` webhook, never by the client-side redirect back to ClouDonna (§8) — the browser returning to a "success" URL is a UX cue, not a state transition.
- **Workspace Ready:** entitlements (§5) resolve immediately from the newly active subscription; no separate provisioning step is needed since nothing in this architecture gates workspace *existence* on billing, only feature *capability*.

## 4. Enterprise flow

```
Talk to Sales → Commercial Agreement → Purchase Order / Invoice → Provisioning
```

Kept structurally separate from self-service, not a variant of it — an Enterprise buyer never sees Stripe Checkout. Concretely: an "Enterprise" plan card links to a contact form/email (mirrors the existing `/for-vendors`, `/for-partners` pattern already in this codebase — a static lead-capture route, no payment surface). Once terms are agreed offline, provisioning is a manual/admin operation that inserts a `subscriptions` row directly with `billing_provider = 'invoice'` and no `billing_provider_subscription_id` — the schema in §5 supports this today without any Stripe involvement at all, exactly because `billing_provider` is a column, not an assumption baked into the table shape.

## 5. Entitlement model

```
subscription → plan → plan_entitlements → capabilities
```

No feature in the product ever checks a plan name, a price, or "is this user on Team or above" directly. Every capability check goes through one function: `getEntitlementsForOrganization(supabase, organizationId)` in `apps/web/src/lib/entitlements/resolver.ts`. Today, since no organization ever has a `subscriptions` row (nothing creates one yet — see §12), this function always returns a hardcoded `FOUNDING_TESTER_ENTITLEMENTS` bundle. That is the entire, honest behavior of the entitlement system right now: **every organization currently gets the same fixed bundle**, resolved through the real future boundary rather than scattered `if` statements, so that the day a `subscriptions` row exists, this one function — and nothing else in the codebase — starts returning plan-derived values instead.

Entitlement keys modeled (per the brief's examples): `decision_memory`, `decision_replay`, `evidence_intelligence`, `executive_reports`, `api_access`, `advanced_governance` (booleans), `max_users`, `max_workspaces`, `max_decisions_per_month` (integers). Note `decision_replay` is `false` in the default bundle regardless of future plan — the feature itself doesn't exist yet (Sprint 6.2 Slice E/F, unstarted), so no entitlement bundle can honestly grant it yet. Entitlements describe *permission*, never *existence*.

## 6. Apple Pay / Google Pay readiness

Both are enabled entirely through Stripe (Checkout and Payment Element both auto-detect and render them) — ClouDonna integrates neither wallet SDK directly, per the brief's explicit instruction. Requirements to satisfy before either can appear in production:

- **Apple Pay:** domain verification (upload Stripe's verification file to `/.well-known/apple-developer-merchantid-domain-association` on the production domain), served over production HTTPS, and only ever rendered by Stripe's own Elements/Checkout — never a custom button. Supported in Safari on macOS/iOS and Chrome on macOS with an Apple Pay–enrolled device; Stripe's client library detects support and simply does not render the button when unavailable, satisfying "never show an Apple Pay button when the device/provider does not support it" for free.
- **Google Pay:** no separate domain verification; requires an eligible browser (Chrome, Edge) with a saved card in the Google account. Same auto-detection behavior via Stripe.
- **Regional availability:** neither wallet is guaranteed available in every geography or on every card network — ClouDonna's copy must never claim universal availability; "accelerated checkout where supported, card payment everywhere else" is the only honest framing, and it's also exactly what Stripe's own components already do without any custom fallback logic on ClouDonna's side.

## 7. Integration design: `BillingProvider` abstraction

Mirrors the two provider-abstraction patterns already established in this codebase (the AI `IntelligenceProvider` boundary, and the `VisitorIntelligenceProvider` recommended in Phase 14 — see `docs/growth/01-b2b-visitor-intelligence-evaluation.md`) rather than importing the Stripe SDK from route handlers directly.

```
apps/web/src/lib/billing/
  provider.ts               # interface: BillingProvider, request/result types
  providers/
    unconfigured.ts          # the ONLY provider registered today — throws a clear
                              # error rather than silently no-oping
  config.ts                  # getBillingProvider() — returns the unconfigured stub
```

`BillingProvider` exposes `createCheckoutSession()` and `createPortalSession()`. No concrete Stripe adapter is written in this phase — writing untested code against a live payment SDK with no Stripe account, no keys, and no way to verify it behaves correctly is not a "low-risk integration seam," it's speculative code the brief's own "do not create fake checkout behavior" instruction argues against. The interface is the seam; the adapter is the one piece deliberately deferred to when a real Stripe account exists to test against (see §12, gate "PRODUCTION PAYMENT PROVIDER CONFIGURED").

## 8. Billing data model

Delivered as a real (unapplied — no local Postgres available to this session, same disclosed limitation as prior migrations this sprint) migration: `supabase/migrations/20260808140000_billing_foundation.sql`.

| Table | Purpose |
|---|---|
| `plans` | Reference rows for `founding_access` / `professional` / `team` / `enterprise`. No price column exists yet — deliberately: modeling price/currency/tax correctly is real work (§10) that hasn't been approved to do yet, and a nullable price column that's always null is worse than no column at all. |
| `entitlement_definitions` | Catalog of entitlement keys and their value type (boolean/integer) — self-documenting, and a foreign key target so `plan_entitlements` can't reference a typo'd key. |
| `plan_entitlements` | Which entitlements each plan grants, and at what value. Publicly readable — it's a capability catalog, not sensitive data. |
| `billing_customers` | One row per organization, holding `billing_provider_customer_id` once a Stripe Customer exists. Never holds card data (§9). |
| `subscriptions` | One *active* row per organization at most (partial unique index on `status in ('trialing','active','past_due')`), holding `plan_id`, `status`, `billing_provider_subscription_id`, `current_period_start/end`, `cancel_at_period_end` — exactly the fields named in the brief, no more. |
| `billing_webhook_events` | Idempotency ledger for provider webhooks (§9) — RLS-closed to every role except the service-role webhook handler. |

`billing_customers` and `subscriptions` are readable only by `is_org_admin()` — billing is not a `member`/`viewer`-visible surface, matching "never force a Fortune 500 procurement process through a consumer checkout" in spirit: billing management is an admin action, not a general team action. No `INSERT`/`UPDATE`/`DELETE` policy exists for the authenticated role on either table — every write is either the webhook handler (service-role, §9) or a future admin-invoked Server Action wrapping a security-definer RPC, never a direct client write, so a compromised or buggy client can never fabricate an "active" subscription.

**Never stored, anywhere in this schema:** card numbers, CVC, Apple Pay payment tokens, Google Pay credentials. `billing_provider_customer_id` and `billing_provider_subscription_id` are opaque Stripe identifiers, not payment credentials — Stripe holds every credential, ClouDonna holds only references to Stripe's own records.

## 9. Webhook architecture

Subscription state is driven exclusively by verified provider events — the client-side "payment succeeded" redirect is a UX cue only, never trusted as state (matches the existing codebase discipline of "server always recomputes, never trusts client-supplied output," already the rule for decision scoring). Design, not yet implemented (no route exists — implementing a webhook handler with no provider account to send it real signed events would be exactly the kind of untestable speculative code §7 argues against):

- A single `POST /api/billing/webhooks` route, `runtime = "nodejs"` (raw body access required for Stripe signature verification — the same reason every Stripe integration guide calls out, not something this codebase can route around).
- Verify `Stripe-Signature` against `STRIPE_WEBHOOK_SECRET` before parsing anything.
- Insert into `billing_webhook_events` keyed on `(billing_provider, provider_event_id)` — the unique constraint makes replay/duplicate delivery a no-op insert failure, not a double-applied state change, before any business logic runs.
- Only then update `subscriptions`/`billing_customers`, using a service-role client scoped to exactly this route — the one legitimate use case for a service-role key this codebase has had (Sprint 6.1's security docs explicitly deferred introducing one until a real need arose; this is that need, and it stays isolated to this single route, never imported by anything reachable from a client component).
- Logs never include the raw payload or any header value — event type and event id only.

## 10. Tax / legal / commercial readiness

Explicitly not invented here — flagged for legal/accounting confirmation before real money moves:

- **Swiss customers:** VAT (MWST) registration and invoice-content requirements (Swiss invoices have specific mandatory fields) need confirmation from ClouDonna's accountant; Stripe Tax can calculate and collect Swiss VAT but registration is ClouDonna's own obligation, not something a payment provider does for you.
- **EU customers:** VAT MOSS/OSS treatment for digital services sold cross-border into the EU — needs the same confirmation. Stripe Tax supports EU VAT calculation once ClouDonna's tax registrations are configured in Stripe.
- **International/US customers:** sales tax varies by state; Stripe Tax covers calculation, registration thresholds still need accounting review.
- **Billing entity:** which legal entity issues invoices (relevant to both VAT treatment and the Terms of Service governing law) is a founder/legal decision, not a technical one — nothing in this architecture assumes an answer.
- **Refund policy, cancellation policy:** not designed here beyond the technical mechanism (`cancel_at_period_end` supports "cancel, keep access until period end" — the least-surprising default per the brief's "no difficult cancellation" trust requirement) — the actual policy text needs founder/legal sign-off.
- **DPA:** already required for Stripe as a sub-processor once real customer payment data flows through it — add to whatever sub-processor list ClouDonna's own privacy policy maintains (same discipline already established in `docs/growth/01-b2b-visitor-intelligence-evaluation.md` §6 for analytics vendors).

## 11. Currencies

Architected for CHF, EUR, USD from the start — `subscriptions`/`plans` deliberately carry no currency assumption baked into a table name or constraint, because Stripe Checkout/Billing natively support presenting a plan's price in multiple currencies without ClouDonna implementing FX conversion logic itself (per the explicit instruction not to build FX conversion unless required — Stripe's multi-currency Prices feature covers this by letting each plan have one Stripe Price object per supported currency, selected by the provider's own locale/geo detection). This is a Stripe-configuration concern for whenever real Prices are created, not something the schema in §8 needs to model further today.

## 12. Founding Tester relationship

Unaffected by anything in this document. Founding Tester access remains what it is today — invitation-based product access with no payment wall — and the entitlement resolver in §5 makes this explicit rather than incidental: every organization without a `subscriptions` row (which today means *every* organization) resolves to `FOUNDING_TESTER_ENTITLEMENTS`, not to a "no access" or "trial expired" state. Nothing in this phase inserts a `subscriptions` row for anyone, anywhere — that only starts happening once a Stripe adapter exists and a checkout actually completes (§7), which is explicitly not built yet.

## 13. Billing analytics

Not implemented this phase (no analytics events fire from any billing surface yet, since there is no checkout to fire them from). When implemented, `pricing_viewed` / `checkout_started` / `checkout_completed` / `subscription_started` / `subscription_upgraded` / `subscription_cancelled` should go through whatever general product-analytics pipeline ClouDonna adopts — never payment credentials, invoice line-item contents, or any Decision Intelligence data (decisions, evidence, org content), matching the same marketing/product-data separation principle already established for visitor intelligence in Phase 14.

## 14. What was built this phase vs. deferred

**Built (real, in the repo, all inert until configured):**
- This document.
- `supabase/migrations/20260808140000_billing_foundation.sql` — schema only, no data, no secrets, additive (touches no existing table).
- `supabase/tests/billing_foundation_verification.sql` — written, not executed (no local Postgres, same disclosed limitation as Sprint 6.2 Slice C).
- `apps/web/src/lib/entitlements/` — the real entitlement boundary, live today (returns the Founding Tester bundle for every organization), with tests.
- `apps/web/src/lib/billing/` — the `BillingProvider` interface + the one safe `unconfigured` implementation.
- `apps/web/src/app/app/settings/billing/page.tsx` — a real, reachable settings page showing current plan/entitlements and a "Contact for Early Access" CTA, never a checkout form.

**Deliberately deferred, not built this phase:**
- Any Stripe SDK dependency or concrete adapter.
- The webhook route (§9 is a design, not a route).
- The plan-selection/checkout page from §3 (would need something real to check out into).
- Pricing of any kind.
- The Customer Portal link (requires a real Stripe Customer to portal into).

---

## FINAL BILLING OUTPUT

**BILLING ARCHITECTURE**
Stripe Billing/Checkout/Payment Element for self-service, Stripe Invoicing for Enterprise, fronted by a `BillingProvider` seam and an `Entitlements` boundary so no UI component ever couples to a price or a plan name directly. First-party schema (`plans`, `entitlement_definitions`, `plan_entitlements`, `billing_customers`, `subscriptions`, `billing_webhook_events`) stores only references and status — never payment credentials.

**RECOMMENDED PROVIDER**
Stripe (Billing + Checkout/Payment Element + Invoicing), per §2.

**APPLE PAY / GOOGLE PAY READINESS**
Enabled entirely through Stripe's own components (§6) — no wallet SDK integrated directly. Not yet actionable: domain verification isn't done because there is no production Stripe account. Auto-detection means the buttons simply won't appear until then, which is the correct, safe default — not a bug to fix.

**SELF-SERVICE FLOW**
Choose Plan → Confirm Workspace → Pay → Subscription Activated → Workspace Ready (§3). UI shell exists (§14) showing "Contact / Early Access" in place of pricing; the Pay step has no working destination yet by design.

**ENTERPRISE BILLING FLOW**
Talk to Sales → Commercial Agreement → Purchase Order/Invoice → Provisioning (§4), structurally separate from self-service, supported by the same schema via `billing_provider = 'invoice'` with no Stripe involvement.

**ENTITLEMENT MODEL**
`subscription → plan → plan_entitlements → capabilities`, resolved through one function (§5), live today, currently returning a fixed Founding Tester bundle for every organization since no subscription can exist yet.

**WEBHOOK MODEL**
Signature-verified, idempotent (unique `(provider, event_id)` ledger table), service-role-scoped, server-side state as sole source of truth (§9) — designed, route not yet built (nothing to send it real events yet).

**TAX / LEGAL BLOCKERS**
Swiss VAT registration, EU VAT/OSS treatment, US sales-tax registration, billing entity selection, refund/cancellation policy text, and Stripe's addition to the sub-processor/DPA list all require founder/accountant/legal confirmation before real money can move (§10) — none of these are technical blockers this document can resolve on its own.

**SAFE TO ACCEPT REAL PAYMENTS**
NO.

Before activation (per the brief's own Commercial Activation Gate):
1. **Pricing approved** — not started; every surface currently shows "Contact / Early Access."
2. **Plan structure approved** — FOUNDING_ACCESS / PROFESSIONAL / TEAM / ENTERPRISE are named as identifiers only, not confirmed as the final structure.
3. **Legal terms reviewed** — Terms of Service don't yet address subscription billing, renewal, or cancellation terms.
4. **Privacy reviewed** — privacy policy doesn't yet disclose Stripe as a payment sub-processor.
5. **Tax/VAT reviewed** — §10, entirely unresolved, needs an accountant.
6. **Billing entity confirmed** — no legal entity has been designated as the invoicing party.
7. **Refund/cancellation policy approved** — no policy text exists yet.
8. **Production payment provider configured** — no Stripe account, no keys, anywhere.
9. **Webhooks verified** — route doesn't exist yet (§9 is design only).
10. **Entitlements verified** — the resolver (§5) works today for the one case that matters right now (no subscription → Founding Tester bundle); the plan-derived path is unexercised until a real subscription can exist.
11. **Test payment completed** — impossible without item 8.

Until all eleven pass: **BILLING STATUS = DESIGNED / NOT ACTIVE.**
