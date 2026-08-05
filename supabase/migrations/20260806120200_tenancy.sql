-- ClouDonna Platform — Database Foundation
-- Migration 03: tenancy (organizations, users, membership, workspaces, projects)
--
-- Tenant hierarchy: organization -> workspace -> project. `organization_id`
-- is denormalized onto workspaces and projects (not just derivable via a
-- join) so every RLS policy in every later migration is a single equality
-- check against `organization_id`, never a multi-hop join. This is a
-- deliberate trade against strict normalization, made once, here, and
-- reused by every table that follows.
--
-- Authentication is explicitly out of scope for this migration set (see
-- docs/platform/database-architecture.md). `users` is a standalone profile
-- table today; the seam for wiring it to Supabase Auth is documented but
-- not built.

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid, -- FK added after `users` exists, below
  constraint organizations_name_not_blank check (btrim(name) <> '')
);

comment on table organizations is
  'The tenant root. Everything in the platform that is not shared reference data hangs off an organization, directly or via workspace/project.';

create unique index organizations_slug_key on organizations (slug) where deleted_at is null;
create index organizations_created_by_idx on organizations (created_by);

create trigger organizations_set_updated_at
  before update on organizations
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint users_email_not_blank check (btrim(email) <> '')
);

comment on table users is
  'Standalone profile table, deliberately not yet wired to Supabase Auth. In production this row''s id is expected to equal the corresponding auth.users.id (created via a sync trigger added when authentication is implemented) — no such trigger exists yet, by design. Cross-organization: a user''s org memberships live in organization_members, not here.';

create unique index users_email_key on users (lower(email)) where deleted_at is null;
create index users_created_by_idx on users (created_by);

create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

alter table organizations
  add constraint organizations_created_by_fkey
  foreign key (created_by) references users (id) on delete set null;

-- ---------------------------------------------------------------------------

create table organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  role organization_member_role not null default 'member',
  invited_by uuid references users (id) on delete set null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null
);

comment on table organization_members is
  'Join table between users and organizations, carrying the role that drives every RLS policy in this schema. A user removed from an org gets deleted_at set here, not a hard delete, so membership history survives.';

create unique index organization_members_org_user_key
  on organization_members (organization_id, user_id) where deleted_at is null;
create index organization_members_user_idx on organization_members (user_id) where deleted_at is null;
create index organization_members_org_idx on organization_members (organization_id) where deleted_at is null;
create index organization_members_created_by_idx on organization_members (created_by);
create index organization_members_invited_by_idx on organization_members (invited_by);

create trigger organization_members_set_updated_at
  before update on organization_members
  for each row execute function set_updated_at();

-- RLS helper functions. SECURITY DEFINER so they can read organization_members
-- regardless of the calling role's own RLS grants, without exposing the table
-- itself — the standard Supabase pattern for avoiding recursive RLS policies.
create or replace function is_org_member(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.deleted_at is null
  );
$$;

comment on function is_org_member(uuid) is
  'RLS predicate: true if the current auth.uid() is an active member of org_id. Returns false (not an error) when auth.uid() is null, i.e. before authentication exists — every tenant-scoped table is closed by default until Sprint auth work wires up real sessions.';

create or replace function is_org_admin(org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
      and m.deleted_at is null
  );
$$;

comment on function is_org_admin(uuid) is
  'RLS predicate: true if the current auth.uid() is an owner/admin member of org_id. Used for membership and organization-settings mutations.';

alter table organizations enable row level security;
alter table users enable row level security;
alter table organization_members enable row level security;

-- organizations: members can read their own org; only admins can update it;
-- no INSERT/DELETE policy for regular roles — org creation and hard deletes
-- are service-role (backend) operations, not something any authenticated
-- user can self-serve yet.
create policy organizations_select on organizations
  for select using (deleted_at is null and is_org_member(id));

create policy organizations_update on organizations
  for update using (deleted_at is null and is_org_admin(id));

-- users: a user can always read/update their own profile row; org admins can
-- read the profiles of members of their own org (needed for member lists).
create policy users_select_self on users
  for select using (deleted_at is null and id = auth.uid());

create policy users_select_org_admin on users
  for select using (
    deleted_at is null
    and exists (
      select 1 from organization_members m
      where m.user_id = users.id
        and m.deleted_at is null
        and is_org_admin(m.organization_id)
    )
  );

create policy users_update_self on users
  for update using (deleted_at is null and id = auth.uid());

-- organization_members: members can see their org's roster; only admins can
-- change roles or add/remove members.
create policy organization_members_select on organization_members
  for select using (deleted_at is null and is_org_member(organization_id));

create policy organization_members_insert on organization_members
  for insert with check (is_org_admin(organization_id));

create policy organization_members_update on organization_members
  for update using (deleted_at is null and is_org_admin(organization_id));

-- ---------------------------------------------------------------------------

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint workspaces_name_not_blank check (btrim(name) <> '')
);

comment on table workspaces is
  'A sub-division within an organization (e.g. a business unit or region). Optional layer between an organization and its projects — most organizations will only ever need one.';

create unique index workspaces_org_slug_key
  on workspaces (organization_id, slug) where deleted_at is null;
create index workspaces_org_idx on workspaces (organization_id) where deleted_at is null;
create index workspaces_created_by_idx on workspaces (created_by);

create trigger workspaces_set_updated_at
  before update on workspaces
  for each row execute function set_updated_at();

alter table workspaces enable row level security;

create policy workspaces_select on workspaces
  for select using (deleted_at is null and is_org_member(organization_id));

create policy workspaces_insert on workspaces
  for insert with check (is_org_member(organization_id));

create policy workspaces_update on workspaces
  for update using (deleted_at is null and is_org_member(organization_id));

-- ---------------------------------------------------------------------------

create table projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  workspace_id uuid not null references workspaces (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint projects_name_not_blank check (btrim(name) <> '')
);

comment on table projects is
  'The unit customers actually work inside day to day — a specific initiative (e.g. "2027 Data Platform RFP"). Decision sessions belong to a project.';

create unique index projects_workspace_slug_key
  on projects (workspace_id, slug) where deleted_at is null;
create index projects_org_idx on projects (organization_id) where deleted_at is null;
create index projects_workspace_idx on projects (workspace_id) where deleted_at is null;
create index projects_created_by_idx on projects (created_by);

create trigger projects_set_updated_at
  before update on projects
  for each row execute function set_updated_at();

alter table projects enable row level security;

create policy projects_select on projects
  for select using (deleted_at is null and is_org_member(organization_id));

create policy projects_insert on projects
  for insert with check (is_org_member(organization_id));

create policy projects_update on projects
  for update using (deleted_at is null and is_org_member(organization_id));
