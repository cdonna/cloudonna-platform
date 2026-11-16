-- ClouDonna Platform — Founder Agent Control Plane (V0.1)
--
-- Operational state for the remote founder-controlled development agent:
-- a task the founder creates, a remote worker (GitHub Actions running the
-- Claude Code GitHub Action) attempts to implement on an isolated branch,
-- and the founder reviews/approves/merges/deploys from a private mobile
-- web app at /founder. See docs/founder-agent/architecture.md.
--
-- Reuses platform_staff / is_platform_staff() exactly as it already gates
-- /app/inquiries — no new privilege table. Founder Control access and
-- Inquiries access are deliberately the same privilege, not a separate
-- "founder_agent_staff" table: both are "can see ClouDonna's own
-- operations," not a customer-facing permission.
--
-- Deliberately NOT added here: a service-role client, a worker-side
-- write path into Postgres, or any mechanism that lets the remote
-- worker itself mutate this schema. Every row in every table below is
-- written by a platform-staff-authenticated request, running under the
-- same RLS this migration defines — including rows that describe what
-- a remote worker reported, which the founder's own browser session
-- fetches from GitHub and writes in, not something the worker pushes in
-- directly. See docs/founder-agent/security.md, "Why there is no
-- worker-to-Postgres write path."

-- ---------------------------------------------------------------------------
-- Enums

-- The 13 states named in the brief, verbatim and in the same order —
-- the state machine (apps/web/src/lib/founder-agent/state-machine.ts) is
-- the single source of truth for which transitions between them are
-- legal; this enum only fixes the vocabulary.
create type founder_task_status as enum (
  'queued',
  'planning',
  'running',
  'testing',
  'review_ready',
  'changes_requested',
  'failed',
  'approved',
  'merge_ready',
  'merged',
  'deploy_ready',
  'deployed',
  'cancelled'
);

create type founder_task_priority as enum ('low', 'medium', 'high', 'urgent');

-- Mirrors the brief's "possible target areas" list exactly, plus the
-- product-page areas that sprint added (decision-skills, data-economy,
-- cost-value-lab, scenario-lab) so a real task can actually name where
-- it applies.
create type founder_task_target_area as enum (
  'homepage',
  'donna_ai',
  'architects',
  'decision_skills',
  'data_economy',
  'trust',
  'cost_value_lab',
  'scenario_lab',
  'intelligence_fabric',
  'infrastructure',
  'bug',
  'other'
);

-- Who performed an action. Distinguishing 'founder' from 'worker' in the
-- schema (not just in application code) is what makes "the agent cannot
-- approve itself" and "the worker cannot write directly to main" checkable
-- from the data, not only from a code review of the handlers that write
-- it. 'system' covers the few events nobody initiates directly (e.g. a
-- staleness check run as part of a merge attempt).
create type founder_task_actor_kind as enum ('founder', 'worker', 'system');

-- Matches the brief's "task event stream" examples, plus the handful
-- this implementation's own lifecycle needs (execution_adapter_unavailable,
-- repair_attempted, rebase_required) to stay honest about what a remote
-- execution adapter can and cannot do yet. This is a closed vocabulary,
-- not free text — the same reasoning business_event_name already uses
-- for the same kind of table.
create type founder_task_event_name as enum (
  'task_created',
  'plan_created',
  'workspace_started',
  'branch_created',
  'file_changed',
  'test_started',
  'test_passed',
  'test_failed',
  'build_started',
  'build_passed',
  'build_failed',
  'quality_gate_failed',
  'repair_attempted',
  'review_ready',
  'changes_requested',
  'approved',
  'rejected',
  'merge_ready_confirmed',
  'rebase_required',
  'merged',
  'deployment_started',
  'deployment_ready',
  'deployment_failed',
  'cancelled',
  'execution_adapter_unavailable',
  'sync_failed'
);

create type founder_task_artifact_type as enum (
  'plan',
  'diff_summary',
  'files_changed',
  'typescript_result',
  'eslint_result',
  'vitest_result',
  'build_result',
  'screenshot_desktop',
  'screenshot_mobile',
  'agent_summary',
  'security_warning'
);

create type founder_task_approval_type as enum ('review', 'merge', 'deploy');
create type founder_task_approval_decision as enum ('approved', 'changes_requested', 'rejected');

-- ---------------------------------------------------------------------------
-- founder_tasks

create table founder_tasks (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references profiles (id) on delete restrict,

  title text not null,
  description text not null,
  priority founder_task_priority not null default 'medium',
  target_area founder_task_target_area not null,
  constraints text,
  acceptance_criteria text not null,

  status founder_task_status not null default 'queued',
  failure_reason text,

  -- Populated once dispatch succeeds — null for every task in an
  -- environment with no execution adapter configured, which is the
  -- honest state of this repository today. agent/<id>-<slug>, never
  -- chosen by the worker itself (see state-machine.ts).
  branch_name text,
  base_commit_sha text,
  head_commit_sha text,
  pr_number integer,
  pr_url text,

  agent_provider text not null default 'anthropic',
  agent_model text,

  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  approved_at timestamptz,
  merged_at timestamptz,
  deployed_at timestamptz,

  constraint founder_tasks_title_not_blank check (btrim(title) <> ''),
  constraint founder_tasks_description_not_blank check (btrim(description) <> ''),
  constraint founder_tasks_acceptance_criteria_not_blank check (btrim(acceptance_criteria) <> '')
);

comment on table founder_tasks is
  'One row per founder-initiated remote development task. created_by is always a human profile — there is no code path that inserts a row here with created_by set to anything else, which is part of how "the agent cannot create its own work" holds. Status only ever advances through apps/web/src/lib/founder-agent/state-machine.ts; this table has no trigger that mutates status on its own.';

create index founder_tasks_status_idx on founder_tasks (status);
create index founder_tasks_created_by_idx on founder_tasks (created_by);
create index founder_tasks_created_at_idx on founder_tasks (created_at desc);

-- No updated_at column, and no set_updated_at() trigger: created_at
-- plus the five explicit *_at milestone columns above already say when
-- every state change happened — a generic updated_at would duplicate
-- that without adding information.

-- founder_tasks_update_staff (below) grants UPDATE to any platform
-- staff member with no narrower WITH CHECK, which Postgres then
-- defaults to the same predicate as USING — i.e. any staff member could
-- otherwise reassign created_by on any task via a direct PostgREST
-- call, bypassing every code path that resolves it from the caller's
-- own session. WITH CHECK alone cannot express "unchanged from its
-- previous value" (it only sees the new row), so this is enforced the
-- same way decision_versions-adjacent tables in this schema already
-- enforce an immutable column: a BEFORE UPDATE trigger.
create or replace function prevent_founder_task_reassignment()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'founder_tasks.created_by is immutable';
  end if;
  return new;
end;
$$;

comment on function prevent_founder_task_reassignment() is
  'Keeps founder_tasks.created_by permanently attributed to whoever actually created the task, regardless of who later updates its status — the schema-level half of "the agent cannot create its own work" staying true even against a direct API call that bypasses this codebase''s own handlers.';

create trigger founder_tasks_prevent_reassignment
  before update on founder_tasks
  for each row execute function prevent_founder_task_reassignment();

-- ---------------------------------------------------------------------------
-- founder_task_events — append-only, same posture as audit_logs and
-- decision_versions: no updated_at, no deleted_at, no UPDATE/DELETE
-- policy for any role below.

create table founder_task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references founder_tasks (id) on delete cascade,
  event_name founder_task_event_name not null,
  actor_kind founder_task_actor_kind not null,
  -- The founder's profile id as text when actor_kind = 'founder'; a
  -- stable worker/run identifier (e.g. a GitHub Actions run id) when
  -- actor_kind = 'worker'; 'system' when nothing external initiated it.
  -- Not a foreign key — a worker run id names something in GitHub, not
  -- a row in this database.
  actor_id text not null,
  -- A concise, human-readable progress line — "Modified 3 files",
  -- "4/4 quality gate checks passed" — never a prompt, a model
  -- response, or a reasoning trace. See founder_task_events_data_shape
  -- below and docs/founder-agent/security.md.
  summary text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint founder_task_events_summary_not_blank check (btrim(summary) <> ''),
  -- The one structural guard against the brief's explicit "do not
  -- persist hidden chain-of-thought": any key literally named for a
  -- reasoning trace is rejected at the database layer, not only by
  -- convention in the application code that writes here.
  constraint founder_task_events_no_chain_of_thought check (
    not (data ? 'chain_of_thought') and
    not (data ? 'reasoning') and
    not (data ? 'raw_prompt') and
    not (data ? 'raw_response')
  )
);

comment on table founder_task_events is
  'Append-only progress stream for a founder task. Every row is written by a platform-staff-authenticated request (see security.md) — a remote worker never has direct database access, so actor_kind=''worker'' rows describe what the founder''s own session read from GitHub and relayed in, not a row the worker inserted itself. No UPDATE or DELETE policy for any regular role: a progress history that can be edited is not a history.';

create index founder_task_events_task_idx on founder_task_events (task_id, created_at);
create index founder_task_events_name_idx on founder_task_events (event_name);

-- ---------------------------------------------------------------------------
-- founder_task_artifacts — review material: diffs, test/build output,
-- screenshots (as a URL once a real pipeline produces one — see
-- docs/founder-agent/architecture.md §7 for what's deferred).

create table founder_task_artifacts (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references founder_tasks (id) on delete cascade,
  artifact_type founder_task_artifact_type not null,
  label text not null,
  -- Small structured or markdown content (a test summary, a diff stat
  -- table). Capped the same way inquiries.message is capped — an
  -- unbounded text column on a row a remote process can trigger the
  -- creation of is a storage vector, not a feature.
  content text,
  -- Populated once a real asset host exists (e.g. a Vercel preview, a
  -- GitHub Actions artifact download link) — null for every artifact
  -- this sprint can produce, same honesty as founder_tasks.branch_name.
  url text,
  created_at timestamptz not null default now(),
  constraint founder_task_artifacts_label_not_blank check (btrim(label) <> ''),
  constraint founder_task_artifacts_content_length check (content is null or char_length(content) <= 20000)
);

comment on table founder_task_artifacts is
  'Review material attached to a task — one row per piece of evidence a founder reviews before approving. Immutable once written: a corrected test result is a new artifact row, not an edited one, for the same reason decision_versions never edits a historical row.';

create index founder_task_artifacts_task_idx on founder_task_artifacts (task_id, created_at);
create index founder_task_artifacts_type_idx on founder_task_artifacts (artifact_type);

-- ---------------------------------------------------------------------------
-- founder_task_approvals — the one table that can never be written by
-- anything but a human founder action. decided_by is NOT NULL and
-- references profiles, with no default — there is no way to insert a
-- row here without naming a real person, which is the schema-level half
-- of "the agent cannot approve itself."

create table founder_task_approvals (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references founder_tasks (id) on delete cascade,
  approval_type founder_task_approval_type not null,
  decision founder_task_approval_decision not null,
  decided_by uuid not null references profiles (id) on delete restrict,
  notes text,
  created_at timestamptz not null default now()
);

comment on table founder_task_approvals is
  'One row per founder decision on a task: a review verdict, a merge confirmation, or a deploy confirmation. decided_by is mandatory and is always a profiles id resolved from the caller''s own authenticated session (never accepted as a request parameter) — see handle-review-task-request.ts, handle-merge-task-request.ts, handle-deploy-task-request.ts. Immutable: a changed mind is a new approval row, never an edited one.';

create index founder_task_approvals_task_idx on founder_task_approvals (task_id, created_at);
create index founder_task_approvals_type_idx on founder_task_approvals (approval_type);

-- ---------------------------------------------------------------------------
-- Row level security — every table here is platform-staff-only, in
-- both directions. Unlike inquiries (public INSERT, staff SELECT), there
-- is no public-facing write path onto any Founder Agent table at all:
-- this is an internal control plane, not a public surface.

alter table founder_tasks enable row level security;
alter table founder_task_events enable row level security;
alter table founder_task_artifacts enable row level security;
alter table founder_task_approvals enable row level security;

create policy founder_tasks_select_staff on founder_tasks
  for select using (is_platform_staff());

create policy founder_tasks_insert_staff on founder_tasks
  for insert to authenticated
  with check (is_platform_staff() and created_by = auth.uid());

create policy founder_tasks_update_staff on founder_tasks
  for update using (is_platform_staff());

-- No DELETE policy on founder_tasks — a task is cancelled (status =
-- 'cancelled'), never removed, for the same audit-trail reason
-- inquiries are closed rather than deleted.

create policy founder_task_events_select_staff on founder_task_events
  for select using (is_platform_staff());

create policy founder_task_events_insert_staff on founder_task_events
  for insert to authenticated
  with check (is_platform_staff());

-- No UPDATE or DELETE policy on founder_task_events for any role —
-- append-only, enforced the same way audit_logs and decision_versions
-- already are in this schema.

create policy founder_task_artifacts_select_staff on founder_task_artifacts
  for select using (is_platform_staff());

create policy founder_task_artifacts_insert_staff on founder_task_artifacts
  for insert to authenticated
  with check (is_platform_staff());

create policy founder_task_approvals_select_staff on founder_task_approvals
  for select using (is_platform_staff());

create policy founder_task_approvals_insert_staff on founder_task_approvals
  for insert to authenticated
  with check (is_platform_staff() and decided_by = auth.uid());

-- No UPDATE or DELETE policy on founder_task_approvals for any role —
-- an approval is a permanent record of what was decided and by whom.
