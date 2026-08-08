-- ClouDonna Platform — Sprint 6.1
-- Migration 13: decisions and decision_versions
--
-- Deliberately a fresh two-table design, not an extension of Sprint 4's
-- `decision_reports` (which remains exactly as Sprint 4 left it —
-- unused by Sprint 6.1, untouched by this migration). `decisions` is a
-- mutable pointer/metadata row; `decision_versions` is the immutable,
-- append-only content. This split — rather than one table doing both
-- jobs — is what makes "never overwrite history" a structural property
-- (an update to `decisions` can only ever touch pointer/metadata
-- columns; `decision_versions` has no update policy for any regular
-- role at all) instead of a convention to remember. See
-- docs/sprint-6/18-persistence-schema.md.

create type decision_status as enum ('draft', 'saved', 'archived');

-- Global (not per-organization) so a human_readable_id is unambiguous
-- even quoted out of context — the same reasoning as documented in
-- docs/sprint-6/12-roadmap.md's earlier draft. A generated column can't
-- call nextval() directly (not an immutable expression), so this is a
-- BEFORE INSERT trigger, not `generated always as`.
create sequence decision_human_id_seq;

create function assign_decision_human_id()
returns trigger
language plpgsql
as $$
begin
  if new.human_readable_id is null then
    new.human_readable_id := 'CDD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('decision_human_id_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create table decisions (
  id uuid primary key default gen_random_uuid(),
  human_readable_id text not null,
  organization_id uuid not null references organizations (id) on delete cascade,
  workspace_id uuid not null references workspaces (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  status decision_status not null default 'saved',
  current_version_id uuid, -- FK added below, after decision_versions exists
  created_by uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint decisions_title_not_blank check (btrim(title) <> '')
);

comment on table decisions is
  'The stable identity and current-state pointer for a saved decision. Its own columns (title, status, current_version_id) are the only ones this slice ever UPDATEs — the actual decision content lives exclusively in decision_versions and is never written here.';

create unique index decisions_human_readable_id_key on decisions (human_readable_id);
create index decisions_org_idx on decisions (organization_id);
create index decisions_project_idx on decisions (project_id);
create index decisions_workspace_idx on decisions (workspace_id);
create index decisions_created_by_idx on decisions (created_by);
create index decisions_project_created_at_idx on decisions (project_id, created_at desc);

create trigger decisions_set_updated_at
  before update on decisions
  for each row execute function set_updated_at();

create trigger decisions_assign_human_id
  before insert on decisions
  for each row execute function assign_decision_human_id();

-- ---------------------------------------------------------------------------

create table decision_versions (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade, -- denormalized, same convention as every Sprint 4 table, single-join RLS
  version_number integer not null check (version_number > 0),
  decision_input_json jsonb not null,
  deterministic_output_json jsonb not null,
  validated_enrichment_json jsonb,
  provider_metadata_json jsonb not null,
  fallback_metadata_json jsonb not null,
  evidence_references_json jsonb not null default '[]'::jsonb,
  schema_version text not null,
  scoring_engine_version text not null,
  knowledge_base_version text not null,
  generated_at timestamptz not null,
  created_by uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  change_reason text
);

comment on table decision_versions is
  'Append-only. Every column here except nothing — there is no updated_at, no deleted_at, and (below) no UPDATE or DELETE policy for any regular role, the same pattern Sprint 4''s audit_logs already established for exactly this reason: a historical record that can be edited is not a historical record. *_json columns hold validated domain payloads only (Sprint 5''s own Zod-checked DecisionReport shape) — never a raw OpenAI response, never a raw prompt. See docs/sprint-6/21-security-review.md.';

create unique index decision_versions_decision_version_number_key
  on decision_versions (decision_id, version_number);
create index decision_versions_decision_idx on decision_versions (decision_id);
create index decision_versions_org_idx on decision_versions (organization_id);
create index decision_versions_created_by_idx on decision_versions (created_by);

alter table decisions
  add constraint decisions_current_version_id_fkey
  foreign key (current_version_id) references decision_versions (id) on delete set null;

-- The FK above only proves current_version_id points at SOME row in
-- decision_versions — it does not prove that row belongs to THIS
-- decision. save_decision() below always sets current_version_id to a
-- version it just inserted for the same decision in the same
-- transaction, so the in-app write path can never violate this, but
-- decisions_update's RLS policy (below) permits any org member to
-- UPDATE current_version_id directly (e.g. via a raw PostgREST call
-- bypassing this app entirely), with nothing at the database level
-- stopping them from pointing one decision's pointer at a *different*
-- decision's version. Enforced here, not just assumed, so "which
-- content displays under which decision id" is a database guarantee,
-- not an application convention. See docs/architecture/sprint-6.1-freeze.md.
create function reject_current_version_mismatch()
returns trigger
language plpgsql
as $$
declare
  v_version_decision_id uuid;
begin
  if new.current_version_id is not null then
    select decision_id into v_version_decision_id from decision_versions where id = new.current_version_id;
    if v_version_decision_id is distinct from new.id then
      raise exception 'decisions.current_version_id must reference a decision_versions row belonging to this same decision';
    end if;
  end if;
  return new;
end;
$$;

create trigger decisions_check_current_version_match
  before insert or update of current_version_id on decisions
  for each row execute function reject_current_version_mismatch();

-- decisions and decision_versions must always agree on organization_id —
-- enforced here, not just assumed, since decision_versions.organization_id
-- is denormalized specifically for RLS and a mismatch would silently
-- break tenant isolation rather than error loudly.
create function reject_decision_version_org_mismatch()
returns trigger
language plpgsql
as $$
declare
  v_decision_org uuid;
begin
  select organization_id into v_decision_org from decisions where id = new.decision_id;
  if v_decision_org is distinct from new.organization_id then
    raise exception 'decision_versions.organization_id must match its parent decision''s organization_id';
  end if;
  return new;
end;
$$;

create trigger decision_versions_check_org_match
  before insert on decision_versions
  for each row execute function reject_decision_version_org_mismatch();

-- Append-only, structurally: no UPDATE, no DELETE trigger needed because
-- no RLS policy below ever grants update/delete on this table to any
-- regular role — there is nothing to additionally reject.

-- ---------------------------------------------------------------------------
-- RLS — same is_org_member()/is_org_admin() pattern as every table in
-- this schema. No new predicate invented.

alter table decisions enable row level security;

create policy decisions_select on decisions
  for select using (is_org_member(organization_id));

create policy decisions_insert on decisions
  for insert with check (is_org_member(organization_id) and created_by = auth.uid());

-- UPDATE is intentionally narrow in spirit (only title/status/
-- current_version_id are ever written by application code — enforced by
-- what the repository layer exposes, per docs/sprint-6/21-security-review.md,
-- not by a column-level trigger in this slice) and narrow in practice:
-- any org member may update, matching the "members can read, creators
-- and org members can manage" model — there is no per-decision owner
-- concept finer than organization membership in Sprint 6.1.
create policy decisions_update on decisions
  for update using (is_org_member(organization_id));

alter table decision_versions enable row level security;

-- Read: any org member. Insert: any org member, and only as themselves
-- (created_by = auth.uid()) — never on another user's behalf. No UPDATE
-- or DELETE policy exists for any role: this is what makes "immutable,
-- append-only" a database guarantee, not an API convention.
create policy decision_versions_select on decision_versions
  for select using (is_org_member(organization_id));

create policy decision_versions_insert on decision_versions
  for insert with check (is_org_member(organization_id) and created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- save_decision(): the one write path the application uses to create a
-- decision and its first version atomically. `security invoker` (the
-- default, stated explicitly) — this function has NO elevated
-- privilege of its own; every insert inside it is still evaluated
-- against the RLS policies above, exactly as if the caller had issued
-- them directly. Its only job is atomicity (one function call = one
-- transaction, so a decision can never exist with no version, and a
-- version can never exist misattributed to the wrong decision) — not a
-- privilege escalation. created_by is always auth.uid(), read from the
-- session itself, never a client-supplied parameter — closes the
-- obvious "save something as someone else" spoofing path structurally,
-- not just via the RLS check that would also catch it.

create function save_decision(
  p_organization_id uuid,
  p_workspace_id uuid,
  p_project_id uuid,
  p_title text,
  p_decision_input jsonb,
  p_deterministic_output jsonb,
  p_enrichment jsonb,
  p_provider_metadata jsonb,
  p_fallback_metadata jsonb,
  p_evidence_references jsonb,
  p_schema_version text,
  p_scoring_engine_version text,
  p_knowledge_base_version text,
  p_change_reason text default null
)
returns table (out_id uuid, out_human_readable_id text)
language plpgsql
security invoker
as $$
declare
  v_decision_id uuid;
  v_version_id uuid;
  v_human_id text;
begin
  insert into decisions (organization_id, workspace_id, project_id, title, created_by)
  values (p_organization_id, p_workspace_id, p_project_id, p_title, auth.uid())
  returning id, human_readable_id into v_decision_id, v_human_id;

  insert into decision_versions (
    decision_id, organization_id, version_number, decision_input_json, deterministic_output_json,
    validated_enrichment_json, provider_metadata_json, fallback_metadata_json, evidence_references_json,
    schema_version, scoring_engine_version, knowledge_base_version, generated_at, created_by, change_reason
  ) values (
    v_decision_id, p_organization_id, 1, p_decision_input, p_deterministic_output,
    p_enrichment, p_provider_metadata, p_fallback_metadata, p_evidence_references,
    p_schema_version, p_scoring_engine_version, p_knowledge_base_version, now(), auth.uid(), p_change_reason
  )
  returning id into v_version_id;

  update decisions set current_version_id = v_version_id where id = v_decision_id;

  return query select v_decision_id, v_human_id;
end;
$$;

comment on function save_decision is
  'Atomic create of a decision + its immutable version 1 + the current_version_id pointer. The only write path Sprint 6.1''s API route uses — see apps/web/src/components/donna-ai/persistence/decisions-repository.ts. Fails as a whole (no partial state) if the caller is not a member of p_organization_id, since every internal statement is still RLS-checked.';
