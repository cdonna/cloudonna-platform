# Commercial Foundation & Public CMS — Status Note

Not new work this sprint — both were reviewed against what the brief asked for, and the honest status of each is below rather than building something redundant or premature.

## Commercial Foundation

Already prepared, in full, before this sprint: `docs/commercial/01-billing-architecture.md` and the accompanying schema (`supabase/migrations/20260808140000_billing_foundation.sql`) already cover everything this phase's brief asks for — Stripe + Apple Pay + Google Pay architecture, subscriptions, trials, enterprise plans, organizations, feature entitlements (`apps/web/src/lib/entitlements/`), a `BillingProvider` seam. **`BILLING STATUS = DESIGNED / NOT ACTIVE`**, unchanged — nothing here was activated, and nothing needed to be added.

The one gap worth naming: **feature flags**. The billing doc's entitlement model (`getEntitlementsForOrganization`) already functions as a de facto flag system for anything gated by plan, but there's no general-purpose feature-flag mechanism for things unrelated to billing (e.g., "show the Founder Dashboard's second tab to staff only, once it exists"). Not built this sprint — no concrete need for one yet beyond what `is_platform_staff()` and `is_org_admin()` already solve directly.

## Public CMS

Not started, and not recommended yet. The brief asks for content management for Vendor Pages, Product Pages, Landing Pages, Benchmarks, Knowledge Articles, Release Notes, and Roadmaps — but of those, only Vendor/Product pages have any real underlying data today (Sprint 4's catalog), and Sprint 4 already gives them a schema (not a CMS UI, but structured tables, which is arguably the more correct foundation to build a CMS *on top of* rather than around). Knowledge Articles already has a table (`knowledge_articles`, Sprint 6). Landing Pages, Benchmarks, and Roadmaps as CMS-managed content have no schema and no clear owner-workflow defined yet.

Building CMS tooling for content that doesn't exist yet, on a night when the more urgent request (Business Operations) was explicitly marked highest priority, would have been exactly the kind of scope-chasing the brief's own opening lines warn against ("If it does not [help real prospects/customers/partners/vendors/founders], do not build it"). Recommend this as its own future sprint, scoped once there's a concrete first piece of content that needs managing outside a code deploy.
