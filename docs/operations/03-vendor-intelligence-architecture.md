# Vendor Intelligence Registry — Architecture (Design Only)

**Status: schema exists (`supabase/migrations/20260809100000_vendor_intelligence_registry.sql`), not executed against a live database (same disclosed limitation as every other migration this sprint — no local Postgres available). No ingestion code exists. Nothing crawls anything.** This document is the architecture the brief asked for, explicitly not the crawler it explicitly forbade.

## What already existed vs. what this phase added

Sprint 4 already built `vendors`, `products`, `capabilities`, and `product_capabilities` — the Vendor/Product/Capability entities this phase's brief names as "core entities" already exist and are populated with real curated catalog data (see `docs/design/system-v1-archive` and the vendor catalog itself). This phase did not rebuild them.

What was missing, and what the new migration adds: **provenance**. Every fact in the existing catalog is currently just... a value in a column, with no record of where it came from or when it was last checked. `vendor_sources`, `vendor_evidence`, and `vendor_source_change_log` are the answer to the brief's own question: *"Where did this information originate? When was it last verified?"* — Donna cannot answer that today; these tables are what would let her, once populated.

## Source ingestion — provider-based framework (interface only)

Mirrors the `BillingProvider` / `NotificationProvider` / `AnalyticsProvider` seams built elsewhere this sprint. **No adapter exists for any source type below — this is the interface a future ingestion worker would implement against, not a working fetcher.**

```typescript
// apps/web/src/lib/vendor-intelligence/source-provider.ts (NOT YET CREATED)
interface VendorSourceProvider {
  readonly sourceType: VendorSourceType; // official_website | official_documentation |
                                          // official_api_reference | official_release_notes |
                                          // official_blog | rss_feed
  fetchLatest(source: VendorSource): Promise<RawSourceSnapshot>;
}
```

A real implementation would need, at minimum, before it touches a single external URL:
- **`robots.txt` compliance** — check and respect disallow rules before any fetch, per source, not assumed.
- **Rate limiting** — per-domain, configurable, conservative by default.
- **Terms-of-use review** — per source, manually, before onboarding it — not something code can determine on its own.
- **Authentication boundaries** — this framework is explicitly for *public, official* sources only. No provider implementation should ever accept credentials for a vendor's protected portal; the brief is explicit that this is out of bounds, and the interface above has no field for one.

None of that exists yet. Building it is the next real sprint here, not this one.

## Knowledge graph — what "answerable" means

The target query shape, once `vendor_evidence` is populated:

```
"What does Snowflake's autoscaling documentation say, and when was it last checked?"
  → vendor_evidence where vendor_id = <Snowflake> and signal_type = 'documentation'
    and fact ilike '%autoscal%'
  → returns: fact, source_url, source_title, observed_at, verification_status
```

This is a plain query against the new schema — no graph database, no new infrastructure. "Knowledge graph" in the brief's language maps to "a evidence table with foreign keys to vendor/product/capability and a provenance record," not a new storage paradigm.

## Vendor Portal (`/for-vendors`) — prepared, not built

The brief's four future capabilities (Claim Product Profile, Submit Official Documentation, Report Incorrect Information, Request Review) all map naturally onto **new rows in `vendor_evidence` with `verification_status = 'unverified'`**, reviewed by staff before promotion to `'verified'` — the schema already supports this workflow without any additional table. What's not built: the actual submission UI on `/for-vendors`, and a review queue (which could reasonably live inside the Founder Dashboard built this sprint, as a second tab, once there's real submission volume to review). Not built now because there's no submission flow to review yet — building a review queue for zero submissions is speculative work the "no placeholders" principle argues against.

## Explicitly not done, and why

- **No RSS/API polling job.** Would require picking a job scheduler (Vercel Cron, a queue, etc.) — an infrastructure decision, not an architecture one, and premature with zero sources registered.
- **No `/for-vendors` submission form.** Same reasoning as above — the backend shape is ready; building the form before any vendor has asked for one is building ahead of demand.
- **No actual crawling, scraping, or automated fetching of any kind.** Per explicit instruction.
