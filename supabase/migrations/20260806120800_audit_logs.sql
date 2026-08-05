-- ClouDonna Platform — Database Foundation
-- Migration 09: audit logs
--
-- Deliberately the one table in this schema with no updated_at, no
-- deleted_at, and no update/delete RLS policy of any kind for any role: an
-- audit trail that can be edited or soft-deleted by the thing it's
-- auditing is not an audit trail. Rows are written once, by application
-- code in the service layer (never a database trigger — an automatic
-- audit-on-write trigger would itself be business logic living inside the
-- database, which this migration set deliberately avoids everywhere).

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: most events are org-scoped, but a small number of
  -- platform-level events (e.g. a service-role maintenance action) have no
  -- owning organization. Those are not exposed by the RLS policy below to
  -- any non-service role.
  organization_id uuid references organizations (id) on delete set null,
  actor_user_id uuid references users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_blank check (btrim(action) <> '')
);

comment on table audit_logs is
  'Append-only record of who changed what, e.g. action=''decision_session.status_changed'', entity_type=''decision_sessions''. before_data/after_data hold whatever subset of the row the calling service chose to log — the database does not enforce a shape on them, since that decision belongs to whichever service is doing the logging.';

create index audit_logs_org_idx on audit_logs (organization_id, created_at desc);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);
create index audit_logs_actor_idx on audit_logs (actor_user_id);

alter table audit_logs enable row level security;

-- Org admins can review their own org's trail. No INSERT policy for any
-- regular role: writes go through the service_role key from the repository
-- layer, which bypasses RLS by design — see packages/database.
create policy audit_logs_select on audit_logs
  for select using (organization_id is not null and is_org_admin(organization_id));
