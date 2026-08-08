# Sprint 6 — 09. Database

**Instruction honored literally: reuse Sprint 4. Extend only where required. No unnecessary schema redesign.** Every extension below is additive (`alter table ... add column`, new tables for genuinely new concepts) — nothing in the existing schema is renamed, restructured, or dropped.

> **Correction, added in the architecture extension pass — this entire document predates Sprint 6.1's implementation and describes a plan implementation diverged from in three material ways.** Flagged explicitly per this task's own instruction not to silently correct. The plan below is kept as the historical design record (it's not wrong reasoning, it just wasn't what got built) — see the actual, as-built account in `docs/sprint-6/18-persistence-schema.md` instead:
>
> 1. **This document says "reuse `decision_reports`, extend via `alter table`."** Sprint 6.1 built new `decisions`/`decision_versions` tables instead, leaving `decision_reports` unused. The `alter table decision_reports ...` block below (with `human_id`, `status decision_report_status`, the full 24-column extension) **was never executed against `decision_reports` and never will be against that table** — the equivalent columns exist, differently named and distributed across two tables, in the migrations `18-persistence-schema.md` documents.
> 2. **This document says "reuse `users`, add the `auth.users` sync trigger to it."** Sprint 6.1 created a new `profiles` table instead and wired the sync trigger there, leaving `users` untouched and unsynced. See `18-persistence-schema.md`, "`profiles` vs. `users` — a disclosed overlap, not a redesign," for the reasoning.
> 3. **This document describes `organization_invitations`, `decision_comments`, and a service-role client "for the one narrow case RLS can't do (invitation acceptance)."** None of this was built in Sprint 6.1 — invitations and comments are both explicitly deferred to Sprint 6.3 (`docs/roadmap/05-sprint-6-3-organizations-and-teams.md`), and **no service-role client exists anywhere in the current implementation** — the new-user bootstrap that this document assumed would need one is instead a `security invoker` database trigger (`17-auth-implementation.md`, "Why no admin client").
>
> None of this means the reasoning below was bad — extending an existing append-only table was a completely reasonable plan before implementation revealed a cleaner alternative (a mutable-pointer/immutable-version split makes "never overwrite history" a structural database property more directly than a single table with an `is_current_version` flag can). It means this specific document is a plan, and `18-persistence-schema.md` is the as-built record — read the latter for what's actually true today.

## Reuse summary

| Sprint 4 table | Sprint 6 disposition |
|---|---|
| `organizations`, `users`, `organization_members`, `workspaces`, `projects` | Reuse as-is. Add the `auth.users` sync trigger only (`02-auth.md`). |
| `decision_frameworks`, `decision_framework_dimensions` | Reuse as-is. |
| `decision_sessions`, `business_goals`, `requirements`, `session_constraints`, `recommendations`, `decision_scores` | Reuse as-is. |
| `decision_reports` | Reuse and **extend** — versioning, lifecycle, provenance, outcome columns (`04-decision-memory.md`, `05-versioning.md`, `06-timeline.md`). The single largest schema change in this plan, and still just `alter table`. |
| `evidence_sources`, `decision_score_evidence_sources` | Reuse as-is. |
| `saved_comparisons`, `saved_comparison_products` | Reuse as-is, unused by Sprint 6's core flow. |
| `audit_logs` | Reuse as-is — already exactly the shape needed. |
| `knowledge_articles` | Reuse as-is, unused by Sprint 6. |
| `ai_conversations`, `ai_messages` | **Not reused** for `DecisionReport` persistence — wrong shape by design (`08-security.md`). Left in place for a genuinely different, unbuilt future feature. |
| `packages/database` | Reuse the existing repository pattern (one class per aggregate, service-role client, no business logic in the database). Extended, not replaced. |

## Net-new schema, in full

```sql
-- Auth sync
create function handle_new_auth_user() ... ;
create trigger on_auth_user_created ... ;

-- Self-service org creation
create policy organizations_insert_self_service on organizations
  for insert with check (created_by = auth.uid());

-- Invitations
create table organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  email text not null,
  role organization_member_role not null default 'member',
  invited_by uuid not null references users (id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Decision lifecycle
create type decision_report_status as enum (
  'draft', 'generated', 'reviewed', 'approved', 'rejected', 'implemented', 'measured', 'retrospective'
);

-- Decision Memory + versioning + outcomes (04, 05, 06)
alter table decision_reports
  add column human_id text,
  add column status decision_report_status not null default 'draft',
  add column decision_input jsonb not null,
  add column deterministic_output jsonb not null,
  add column enrichment jsonb,
  add column evidence_references text[] not null default '{}',
  add column provider_id text not null,
  add column provider_model text,
  add column fallback_status text not null,
  add column fallback_reason text,
  add column architecture_summary text,
  add column rationale text,
  add column assumptions text[],
  add column risks text[],
  add column schema_version text not null,
  add column scoring_engine_version text not null,
  add column knowledge_base_version text not null,
  add column version_number integer not null default 1,
  add column is_current_version boolean not null default true,
  add column decision_session_version_of uuid references decision_reports (id) on delete set null,
  add column expected_outcomes text,
  add column actual_outcomes text,
  add column success_measures text,
  add column implementation_status text,
  add column retrospective_notes text,
  add column outcome_recorded_at timestamptz;

create sequence decision_human_id_seq;
create unique index decision_reports_one_current_version
  on decision_reports (coalesce(decision_session_version_of, id))
  where is_current_version and deleted_at is null;
create trigger decision_reports_immutable_content
  before update on decision_reports
  for each row execute function reject_decision_report_content_mutation();

-- Comments (06-timeline.md)
create table decision_comments (
  id uuid primary key default gen_random_uuid(),
  decision_report_id uuid not null references decision_reports (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  author_id uuid not null references users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
```

## Migration strategy

New, sequentially-numbered files in `supabase/migrations/`, continuing the existing `20260806*_*.sql` naming convention — the Sprint 4 files already in `main` are never edited, per standard migration-immutability discipline. Applied incrementally, in the phase order given in `12-roadmap.md`, each gated by that phase's own tests — not all at once.

## Repository layer changes

`packages/database/src/repositories/` already has `organizations.repository.ts`, `decision-sessions.repository.ts`, `decision-reports.repository.ts`. Sprint 6 adds `organization-invitations.repository.ts` and `decision-comments.repository.ts`, and extends `decision-reports.repository.ts` with `createVersion()`, `getCurrentVersion()`, `getLineageHistory()`, `updateStatus()`, `recordOutcome()`. No change to `vendor-catalog.repository.ts` or `partners.repository.ts`.

## Service-role boundary and browser/server client separation

Unchanged from the existing `packages/database` design (`client.ts`): the service-role client bypasses RLS entirely and is used only inside the repository layer, in a trusted server context, for the one narrow case RLS itself can't do (invitation acceptance by a not-yet-member user). Every other read/write goes through the per-request server client, running as the real authenticated user, so RLS is the enforcement layer — never application-layer filtering standing in for it.

## Database extensions from the Knowledge Graph / Evidence Engine / Outcome Intelligence package

Added in the architecture extension pass. `13-knowledge-graph.md`, `14-product-knowledge-layer.md`, and `25-outcome-intelligence.md` each define new tables (`product_facts`, the Knowledge Graph's node and edge tables, `decision_outcomes`) — all follow the same additive, non-destructive discipline this document commits to: new tables, `alter table ... add column` where extending, never a rename or restructure of Sprint 4's or Sprint 6.1's existing tables. `evidence_sources`/`evidence_reliability_tier`/`knowledge_articles` (Sprint 4, listed as "reuse as-is" above and genuinely still true) are the direct foundation the Knowledge Graph package builds on, not a replacement for them — see `docs/roadmap/10-release-sequencing.md`'s "Reuse of Sprint 4 work" table for the complete picture across every stage, not just this one.

## What this document does not decide

- Which actual Supabase project (dev/staging/prod) any of this targets. No project has been provisioned or connected — the schema exists in git history and, as of Platform Foundation v1, in `main`'s tree, but is wired to nothing live.
