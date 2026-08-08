-- ClouDonna Platform — Vendor Intelligence Registry (Phase 3, architecture only)
--
-- Purely additive, references the existing Sprint 4 catalog (vendors,
-- products, capabilities) rather than recreating it — those tables
-- already cover the "Vendor / Product / Capability" entities named in
-- this phase's brief. What's genuinely missing, and what this migration
-- adds, is the provenance layer: where does a fact come from, when was
-- it observed, has it been verified, and what's the registry of
-- official sources per vendor to (eventually) check for updates.
--
-- No ingestion code ships with this migration — see
-- docs/operations/03-vendor-intelligence-architecture.md for the
-- provider-based framework design. This is schema only, and it is
-- empty on creation: nothing crawls anything as a result of this file
-- existing.

create type vendor_source_type as enum (
  'official_website',
  'official_documentation',
  'official_api_reference',
  'official_release_notes',
  'official_blog',
  'rss_feed'
);

create table vendor_sources (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  source_type vendor_source_type not null,
  url text not null,
  title text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users (id) on delete set null,
  constraint vendor_sources_url_not_blank check (btrim(url) <> '')
);

comment on table vendor_sources is
  'The registry of official sources a vendor is checked against — "official sources, documentation, release notes, API references, RSS" from the Phase 3 brief. last_verified_at is null until a real ingestion pass runs (none exists yet); this table can be populated and reviewed manually before any automated checking is built.';

create unique index vendor_sources_vendor_url_key on vendor_sources (vendor_id, url);
create index vendor_sources_vendor_idx on vendor_sources (vendor_id);

create trigger vendor_sources_set_updated_at
  before update on vendor_sources
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create type evidence_signal_type as enum (
  'documentation',
  'release_notes',
  'benchmark',
  'community_signal',
  'partner_signal',
  'general'
);

create table vendor_evidence (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  product_id uuid references products (id) on delete cascade,
  capability_id uuid references capabilities (id) on delete set null,
  source_id uuid references vendor_sources (id) on delete set null,
  signal_type evidence_signal_type not null default 'general',
  fact text not null,
  source_url text,
  source_title text,
  observed_at timestamptz not null default now(),
  published_at timestamptz,
  reliability evidence_reliability_tier not null,
  verification_status verification_status not null default 'unverified',
  confidence numeric(3, 2) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users (id) on delete set null,
  constraint vendor_evidence_fact_not_blank check (btrim(fact) <> '')
);

comment on table vendor_evidence is
  'Every extracted fact, with full provenance — fact/vendor/product/capability/source/source_url/source_title/observed_at/published_at/confidence/verification_status, exactly the field list the Phase 3 brief specifies. This is what lets Donna eventually answer "where did this information originate, and when was it last verified" — the question the brief poses directly. reliability and verification_status reuse the exact enums Sprint 4 already defined for analyst_reports/customer_references, not a parallel taxonomy.';

create index vendor_evidence_vendor_idx on vendor_evidence (vendor_id);
create index vendor_evidence_product_idx on vendor_evidence (product_id);
create index vendor_evidence_capability_idx on vendor_evidence (capability_id);
create index vendor_evidence_verification_idx on vendor_evidence (verification_status);

create trigger vendor_evidence_set_updated_at
  before update on vendor_evidence
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table vendor_source_change_log (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references vendor_sources (id) on delete cascade,
  changed_at timestamptz not null default now(),
  change_summary text not null,
  constraint vendor_source_change_log_summary_not_blank check (btrim(change_summary) <> '')
);

comment on table vendor_source_change_log is
  '"Change history" from the Phase 3 brief — a append-only log of what changed at a given source and when noticed. Empty until a real ingestion or manual-review pass exists to write to it.';

create index vendor_source_change_log_source_idx on vendor_source_change_log (source_id, changed_at desc);

-- ---------------------------------------------------------------------------
-- Row level security — public read (this is catalog data, same posture
-- as vendors/products themselves), write restricted to org admins for
-- now (mirrors product_capabilities' existing pattern: public SELECT,
-- no public write policy — inserts are an internal/admin operation
-- until a real vendor-submission review flow exists, see /for-vendors
-- prep below).

alter table vendor_sources enable row level security;
alter table vendor_evidence enable row level security;
alter table vendor_source_change_log enable row level security;

create policy vendor_sources_select on vendor_sources for select using (true);
create policy vendor_evidence_select on vendor_evidence for select using (true);
create policy vendor_source_change_log_select on vendor_source_change_log for select using (true);

-- No INSERT/UPDATE/DELETE policy for any role on any of the three
-- tables above — populating the registry is an internal, reviewed
-- operation (a future admin tool or direct migration), never a public
-- or even a plain-authenticated write, consistent with "vendor
-- submissions never affect rankings automatically... every submission
-- enters review" from the Phase 3 brief.
