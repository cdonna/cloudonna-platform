-- ClouDonna Platform — Phase 15
-- Migration: billing foundation (schema only — no data, no provider keys)
--
-- Purely additive: no existing table is touched. Every table here is
-- empty on creation and stays empty until a real payment provider is
-- configured and a Stripe (or invoice) checkout actually completes —
-- nothing in this migration or anywhere else in this sprint inserts a
-- row into any table below. See docs/commercial/01-billing-architecture.md
-- for the full design and the gates that must pass before that changes.
--
-- Hangs off `organization_id`, exactly like every other tenant-scoped
-- table in this schema (decisions, projects, workspaces) — a
-- subscription belongs to an organization, never to an individual user,
-- consistent with is_org_member()/is_org_admin() already being the
-- established RLS predicates (supabase/migrations/20260806120200_tenancy.sql).

-- ---------------------------------------------------------------------------
-- Plans — identifiers only. No price/currency column exists yet:
-- pricing has not been Founder-approved (docs/commercial/01-billing-
-- architecture.md §10), and a nullable price column that is always null
-- is worse than no column at all. Add pricing in a dedicated later
-- migration once real Stripe Price objects exist to reference.

create type billing_plan_code as enum ('founding_access', 'professional', 'team', 'enterprise');

create table plans (
  id uuid primary key default gen_random_uuid(),
  code billing_plan_code not null unique,
  display_name text not null,
  is_purchasable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plans_display_name_not_blank check (btrim(display_name) <> '')
);

comment on table plans is
  'Commercial plan identifiers only — no price. is_purchasable is false for every row until Founder Commercial Approval (docs/commercial/01-billing-architecture.md, Commercial Activation Gate); it exists so a future checkout page can filter to purchasable plans without a code change.';

create trigger plans_set_updated_at
  before update on plans
  for each row execute function set_updated_at();

insert into plans (code, display_name, is_purchasable) values
  ('founding_access', 'Founding Access', false),
  ('professional', 'Professional', false),
  ('team', 'Team', false),
  ('enterprise', 'Enterprise', false);

-- ---------------------------------------------------------------------------
-- Entitlement catalog — the vocabulary plan_entitlements below is allowed
-- to reference. Keeps a typo'd entitlement key a foreign-key violation
-- at insert time, not a silent no-op read later.

create type entitlement_value_type as enum ('boolean', 'integer');

create table entitlement_definitions (
  key text primary key,
  description text not null,
  value_type entitlement_value_type not null,
  constraint entitlement_definitions_key_not_blank check (btrim(key) <> '')
);

comment on table entitlement_definitions is
  'Catalog of entitlement keys capabilities can check (see apps/web/src/lib/entitlements/). Matches the examples enumerated in docs/commercial/01-billing-architecture.md §5 exactly — add a row here before any plan_entitlements row can reference a new key.';

insert into entitlement_definitions (key, description, value_type) values
  ('decision_memory', 'Access to saved Decision Memory (persisted decisions and version history).', 'boolean'),
  ('decision_replay', 'Access to Decision Replay (re-executing the engine against historical input). Not yet built as a product capability — no plan should grant this until it exists.', 'boolean'),
  ('evidence_intelligence', 'Access to evidence-backed AI narrative enrichment.', 'boolean'),
  ('executive_reports', 'Access to exportable executive-level report generation.', 'boolean'),
  ('api_access', 'Programmatic API access to Decision Intelligence data.', 'boolean'),
  ('advanced_governance', 'Advanced governance controls (approval workflows, audit export, custom roles).', 'boolean'),
  ('max_users', 'Maximum number of organization members.', 'integer'),
  ('max_workspaces', 'Maximum number of workspaces per organization.', 'integer'),
  ('max_decisions_per_month', 'Maximum number of new decisions per calendar month.', 'integer');

-- ---------------------------------------------------------------------------
-- Plan → entitlement mapping. Publicly readable (see RLS below) — this
-- is a capability catalog, not sensitive commercial data (no price
-- lives here).

create table plan_entitlements (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans (id) on delete cascade,
  entitlement_key text not null references entitlement_definitions (key) on delete cascade,
  boolean_value boolean,
  integer_value integer,
  created_at timestamptz not null default now(),
  constraint plan_entitlements_plan_key_unique unique (plan_id, entitlement_key),
  constraint plan_entitlements_value_shape check (
    (boolean_value is not null and integer_value is null)
    or (boolean_value is null and integer_value is not null)
  )
);

comment on table plan_entitlements is
  'What each plan grants. Deliberately empty on creation — no entitlement bundle has been Founder-approved per plan yet. apps/web/src/lib/entitlements/resolver.ts falls back to a hardcoded Founding Tester bundle for every organization until rows exist here AND a subscription references them, so this table being empty does not mean the product has no entitlements today — it means every organization currently gets the same fixed bundle, not a plan-derived one.';

-- ---------------------------------------------------------------------------
-- Billing customer — one per organization, holds the opaque provider
-- customer reference. Never a payment credential (see table comment).

create table billing_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations (id) on delete cascade,
  billing_provider text not null default 'stripe',
  billing_provider_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users (id) on delete set null
);

comment on table billing_customers is
  'One row per organization once it first touches billing (created on first checkout session, or manually for an Enterprise invoice customer). billing_provider_customer_id is an opaque Stripe Customer id, never a payment credential — card data, CVC, and wallet tokens are never stored anywhere in this schema; Stripe holds every credential, this table holds only a reference to Stripe''s own record.';

create index billing_customers_provider_customer_idx on billing_customers (billing_provider, billing_provider_customer_id);

create trigger billing_customers_set_updated_at
  before update on billing_customers
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Subscriptions — the field list matches docs/commercial/01-billing-
-- architecture.md §8 and the brief's own BILLING DATA MODEL section
-- exactly: current_period_start/end, cancel_at_period_end, no more.

create type billing_subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid'
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  billing_customer_id uuid not null references billing_customers (id) on delete cascade,
  plan_id uuid not null references plans (id),
  status billing_subscription_status not null,
  billing_provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references users (id) on delete set null
);

comment on table subscriptions is
  'Subscription state as last reported by the billing provider''s webhooks — never written from a client-trusted "payment successful" signal (docs/commercial/01-billing-architecture.md §9). billing_provider_subscription_id is null for invoice/Enterprise subscriptions (billing_customers.billing_provider = ''invoice''), which never touch Stripe at all.';

-- At most one "live" subscription per organization at a time. A
-- canceled/incomplete_expired row does not block a new one, so
-- re-subscribing after cancellation is a normal insert, not an update
-- of the old row.
create unique index subscriptions_org_active_unique on subscriptions (organization_id)
  where status in ('trialing', 'active', 'past_due');

create index subscriptions_org_idx on subscriptions (organization_id);
create index subscriptions_provider_subscription_idx on subscriptions (billing_provider_subscription_id);

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Webhook idempotency ledger. No end-user-facing role can read or write
-- this table at all (see RLS below) — only the service-role client used
-- exclusively by the future /api/billing/webhooks route handler
-- (docs/commercial/01-billing-architecture.md §9), never anything
-- reachable from a client component. This is the one documented,
-- deliberate use of a service-role key in this codebase — Sprint 6.1's
-- security review explicitly deferred introducing one until a real need
-- existed (docs/sprint-6/08-security.md); this is that need, and it
-- stays isolated to this single future route.

create table billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  billing_provider text not null default 'stripe',
  provider_event_id text not null,
  event_type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  payload_json jsonb not null,
  constraint billing_webhook_events_provider_event_unique unique (billing_provider, provider_event_id)
);

comment on table billing_webhook_events is
  'Idempotency ledger for billing-provider webhook deliveries. The unique (billing_provider, provider_event_id) constraint makes a duplicate/replayed delivery a no-op insert failure, caught before any subscriptions/billing_customers write runs, rather than a double-applied state change.';

create index billing_webhook_events_received_idx on billing_webhook_events (received_at);

-- ---------------------------------------------------------------------------
-- Row level security

alter table plans enable row level security;
alter table entitlement_definitions enable row level security;
alter table plan_entitlements enable row level security;
alter table billing_customers enable row level security;
alter table subscriptions enable row level security;
alter table billing_webhook_events enable row level security;

-- plans / entitlement_definitions / plan_entitlements: public capability
-- catalog, no price or customer data — readable by any authenticated
-- user, no write policy for any authenticated role (managed by a future
-- admin tool or migration, not self-service).
create policy plans_select on plans
  for select using (true);

create policy entitlement_definitions_select on entitlement_definitions
  for select using (true);

create policy plan_entitlements_select on plan_entitlements
  for select using (true);

-- billing_customers / subscriptions: admin-only within the owning
-- organization — billing is a management action, not a general team
-- action (docs/commercial/01-billing-architecture.md §8). No INSERT/
-- UPDATE/DELETE policy for the authenticated role on either table: every
-- write is either the webhook handler (service-role, bypasses RLS by
-- design) or a future admin-invoked security-definer RPC, never a
-- direct client write — a compromised or buggy client can never
-- fabricate an "active" subscription.
create policy billing_customers_select on billing_customers
  for select using (is_org_admin(organization_id));

create policy subscriptions_select on subscriptions
  for select using (is_org_admin(organization_id));

-- billing_webhook_events: no policy at all for any role — RLS enabled
-- with zero policies means every authenticated/anon request is denied
-- by default; only a service-role client (which bypasses RLS entirely,
-- per Supabase's standard behavior) can ever touch this table.
