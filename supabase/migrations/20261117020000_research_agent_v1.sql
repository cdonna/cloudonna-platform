-- ClouDonna Platform — Research Agent V1
-- Migration: research_sessions, research_evidence, research_conflicts
--
-- A research session has its own mutable lifecycle (PLANNED -> RUNNING
-- -> COMPLETED/FAILED/PARTIAL) and individual evidence items go
-- through an independent PROPOSED -> ACCEPTED/REJECTED review — neither
-- fits the existing decisions/decision_versions model, which is
-- deliberately immutable and append-only (a research session is
-- explicitly NOT a new decision version; it is in-progress work that
-- may or may not ever be accepted into the decision). Three tables,
-- not five: research tasks are planning output with no independent
-- review lifecycle of their own, so they are stored as jsonb on the
-- session row (`tasks_json`) rather than as rows; sources are
-- denormalized directly onto each research_evidence row rather than a
-- separate deduplicated sources table, which V1 does not yet need
-- (documented as a known limitation, not an oversight).
--
-- Same conventions as every other table in this schema: denormalized
-- organization_id for single-join RLS, is_org_member() as the only
-- predicate, soft-delete-free (research rows are safe to hard-review
-- but the rows themselves are never deleted, only status-transitioned).

create type research_session_status as enum ('planned', 'running', 'completed', 'failed', 'partial');
create type research_evidence_status as enum ('proposed', 'accepted', 'rejected');
create type research_conflict_status as enum ('open', 'resolved', 'dismissed');

create table research_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  decision_id uuid not null references decisions (id) on delete cascade,
  status research_session_status not null default 'planned',
  -- Planning output (ResearchTask[]) — not independently reviewable,
  -- so it lives here as data rather than as its own table. See
  -- research/types.ts for the TS shape this jsonb column holds.
  tasks_json jsonb not null default '[]'::jsonb,
  sources_found integer not null default 0,
  evidence_proposed integer not null default 0,
  conflicts_found integer not null default 0,
  gaps_remaining jsonb not null default '[]'::jsonb,
  stop_reason text,
  agent_version text not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint research_sessions_completed_after_started check (completed_at is null or started_at is null or completed_at >= started_at)
);

comment on table research_sessions is
  'One "Run Research" invocation for one decision — mutable (status/counters update as the session progresses), unlike decision_versions which is immutable. A decision may have many sessions over time, forming its own research history distinct from the decision version timeline.';

create index research_sessions_decision_idx on research_sessions (decision_id);
create index research_sessions_org_idx on research_sessions (organization_id);
create index research_sessions_created_by_idx on research_sessions (created_by);
create trigger research_sessions_set_updated_at before update on research_sessions for each row execute function set_updated_at();

create table research_evidence (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  research_session_id uuid not null references research_sessions (id) on delete cascade,
  decision_id uuid not null references decisions (id) on delete cascade,
  -- The six canonical evidence types (components/showcase/EvidenceTag.tsx's
  -- EvidenceType) — reused verbatim, not a parallel vocabulary. Research
  -- Agent V1 only ever writes official-source or ai-interpretation (brief
  -- §2); the column allows the full set so a later slice (e.g. a
  -- genuinely observed-data source) is additive, not a migration.
  evidence_type text not null check (evidence_type in ('official-source', 'customer-input', 'observed-data', 'calculated', 'ai-interpretation', 'assumption')),
  claim text not null,
  interpretation text,
  source_url text,
  source_title text,
  publisher text,
  published_at date,
  retrieved_at timestamptz not null,
  -- criterion_id is a ScoreDimensionKey (architecture/business/.../
  -- strategic) and option_id a vendor-intelligence catalog id — the
  -- same two identifier spaces the Decision Engine already uses, never
  -- a parallel "criterion"/"option" concept invented for research.
  criterion_id text,
  option_id text,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  freshness text not null check (freshness in ('current', 'aging', 'stale', 'unknown')),
  research_task_id text not null,
  agent_version text not null,
  status research_evidence_status not null default 'proposed',
  metadata jsonb not null default '{}'::jsonb,
  decided_by uuid references profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint research_evidence_decided_consistency check (
    (status = 'proposed' and decided_by is null and decided_at is null) or
    (status in ('accepted', 'rejected') and decided_by is not null and decided_at is not null)
  )
);

comment on table research_evidence is
  'One claim, with full provenance, proposed by the Research Agent for one decision. Never auto-trusted: status starts "proposed" and only a human accept/reject (handle-research-evidence-decision) moves it — see brief §11, "PROPOSED -> HUMAN ACCEPT -> ACTIVE EVIDENCE". Accepted rows feed evidence diagnostics/confidence only, never a deterministic score directly (engine/evidence.ts).';

create index research_evidence_session_idx on research_evidence (research_session_id);
create index research_evidence_decision_idx on research_evidence (decision_id);
create index research_evidence_org_idx on research_evidence (organization_id);
create index research_evidence_status_idx on research_evidence (decision_id, status);
create trigger research_evidence_set_updated_at before update on research_evidence for each row execute function set_updated_at();

create table research_conflicts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  research_session_id uuid not null references research_sessions (id) on delete cascade,
  decision_id uuid not null references decisions (id) on delete cascade,
  claim_a_evidence_id uuid not null references research_evidence (id) on delete cascade,
  claim_b_evidence_id uuid not null references research_evidence (id) on delete cascade,
  criterion_id text,
  option_id text,
  severity text not null check (severity in ('low', 'medium', 'high')),
  explanation text not null,
  status research_conflict_status not null default 'open',
  resolved_by uuid references profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint research_conflicts_distinct_claims check (claim_a_evidence_id <> claim_b_evidence_id)
);

comment on table research_conflicts is
  'A detected contradiction between two research_evidence claims for the same option/criterion — the system never silently picks one side (brief §15). Resolution is a human action (resolve/dismiss), never automatic.';

create index research_conflicts_session_idx on research_conflicts (research_session_id);
create index research_conflicts_decision_idx on research_conflicts (decision_id);
create index research_conflicts_org_idx on research_conflicts (organization_id);

-- ---------------------------------------------------------------------------
-- RLS — identical is_org_member()-gated pattern as every tenant-scoped
-- table in this schema. No new predicate invented. No UPDATE policy
-- allows changing organization_id/decision_id (only the application's
-- narrow write paths below ever target status/metadata columns).

alter table research_sessions enable row level security;
alter table research_evidence enable row level security;
alter table research_conflicts enable row level security;

create policy research_sessions_select on research_sessions for select using (is_org_member(organization_id));
create policy research_sessions_insert on research_sessions for insert with check (is_org_member(organization_id) and created_by = auth.uid());
create policy research_sessions_update on research_sessions for update using (is_org_member(organization_id));

create policy research_evidence_select on research_evidence for select using (is_org_member(organization_id));
create policy research_evidence_insert on research_evidence for insert with check (is_org_member(organization_id));
create policy research_evidence_update on research_evidence for update using (is_org_member(organization_id));

create policy research_conflicts_select on research_conflicts for select using (is_org_member(organization_id));
create policy research_conflicts_insert on research_conflicts for insert with check (is_org_member(organization_id));
create policy research_conflicts_update on research_conflicts for update using (is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- decide_research_evidence(): the only path that transitions
-- research_evidence out of "proposed" — atomic, security invoker (no
-- elevated privilege; RLS above still applies to the underlying
-- update), and the one place that enforces decided_by = auth.uid()
-- structurally rather than trusting a client-supplied reviewer id.

create function decide_research_evidence(
  p_evidence_id uuid,
  p_status research_evidence_status
)
returns table (out_id uuid, out_status research_evidence_status)
language plpgsql
security invoker
as $$
declare
  v_id uuid;
  v_status research_evidence_status;
begin
  if p_status not in ('accepted', 'rejected') then
    raise exception 'decide_research_evidence only accepts accepted or rejected, not %', p_status;
  end if;

  update research_evidence
  set status = p_status, decided_by = auth.uid(), decided_at = now()
  where id = p_evidence_id
  returning id, status into v_id, v_status;

  if v_id is null then
    raise exception 'Evidence not found or not accessible.';
  end if;

  return query select v_id, v_status;
end;
$$;

comment on function decide_research_evidence is
  'Accept/reject one proposed evidence item. The only write path for Research Review UI accept/reject actions — see apps/web/src/components/donna-ai/research/persistence/research-repository.ts. decided_by is always auth.uid(), never a client-supplied value.';
