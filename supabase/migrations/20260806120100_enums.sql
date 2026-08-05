-- ClouDonna Platform — Database Foundation
-- Migration 02: enumerated types
--
-- Every fixed vocabulary in the schema is declared here, once, instead of
-- being re-typed as a CHECK constraint per table. Two families:
--
--   (a) Vocabularies that already exist as TypeScript union types in the
--       Donna AI scoring engine (apps/web/src/components/donna-ai/**, built
--       in Sprint 3, not yet persisted anywhere). Kept in lockstep with
--       those types by design — this schema is the eventual persistence
--       target for that in-memory model. Where TypeScript uses camelCase
--       (e.g. "aiReadiness"), the SQL enum uses snake_case instead
--       ("ai_readiness"); translating between the two is the repository
--       layer's job, not the database's.
--   (b) Platform vocabularies that don't exist in the TypeScript layer yet
--       because nothing has needed them until this migration (tenancy
--       roles, session status, verification status, etc).

-- (a) Aligned with apps/web .../vendor-intelligence/types.ts MaturityBand
create type maturity_band as enum ('emerging', 'developing', 'established', 'leading');

-- (a) Aligned with .../scoring/types.ts ScoreDimensionKey
create type score_dimension_key as enum (
  'architecture', 'business', 'technology', 'governance', 'ai_readiness',
  'security', 'ecosystem', 'cost', 'time_to_value', 'strategic'
);

-- (a) Aligned with .../vendor-intelligence/types.ts
create type cloud_model as enum ('single-cloud', 'multi-cloud', 'hybrid', 'on-premise-capable');
create type deployment_model as enum ('saas', 'paas', 'iaas', 'managed-service', 'self-hosted');
create type cost_tier as enum ('entry', 'mid', 'premium', 'enterprise-custom');
create type implementation_complexity as enum ('low', 'medium', 'high', 'very-high');
create type time_to_value_band as enum ('weeks', '1-3-months', '3-6-months', '6-plus-months');
create type lock_in_risk as enum ('low', 'medium', 'high', 'very-high');
create type platform_category as enum (
  'data-platform', 'hyperscale-cloud', 'operational-database',
  'enterprise-legacy', 'decision-ops-intelligence'
);

-- (a) Aligned with apps/web .../donna-ai/types.ts. Deliberately NOT the same
-- pattern as `industries` (a reference table, extensible without a
-- migration) — employee_band, trait and goal_tag are small, closed
-- vocabularies wired directly into the deterministic scoring engine's
-- matching logic, so a fixed enum is the honest representation: adding a
-- new trait is a code change to the scoring engine anyway, not just a data
-- change.
create type employee_band as enum ('smb', 'mid-market', 'enterprise', 'global-enterprise');
create type goal_tag as enum (
  'modernization', 'business-ai', 'planning', 'governance',
  'data-products', 'cost-reduction', 'compliance', 'innovation'
);
create type trait as enum (
  'sap-native', 'governed-data', 'modern-architecture', 'multi-cloud',
  'enterprise-scale', 'cost-efficient', 'ai-ready', 'azure-aligned',
  'aws-aligned', 'gcp-aligned', 'hyperscale-infra', 'operational-workload',
  'high-touch-enterprise', 'legacy-integration', 'vendor-neutral'
);

-- (b) Tenancy
create type organization_member_role as enum ('owner', 'admin', 'member', 'viewer');

-- (b) Decision engine
create type decision_session_status as enum ('draft', 'in_progress', 'completed', 'archived');
create type constraint_type as enum (
  'budget', 'timeline', 'risk_appetite', 'preferred_cloud',
  'preferred_vendor', 'internal_skills', 'other'
);

-- (b) Trust and provenance — every recommendation traces back to evidence,
-- and not all evidence carries the same weight. Used by evidence_sources so
-- the UI/report layer can visibly distinguish "vendor's own claim" from
-- "independent analyst report" rather than presenting both as equally
-- authoritative (a neutrality requirement carried over from the Sprint 3
-- vendor-intelligence model).
create type evidence_reliability_tier as enum (
  'primary_source', 'vendor_published', 'analyst_report', 'community', 'internal_review'
);

-- (b) Partner ecosystem
create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');

-- (b) AI conversations — the message role, not the conversation's business
-- meaning. See docs for why AI Conversations/Messages exist in this schema
-- even though OpenAI integration itself is explicitly out of scope here.
create type ai_message_role as enum ('system', 'user', 'assistant', 'tool');
