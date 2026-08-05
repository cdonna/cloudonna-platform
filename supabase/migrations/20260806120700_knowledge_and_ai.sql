-- ClouDonna Platform — Database Foundation
-- Migration 08: knowledge base and AI conversation history
--
-- IMPORTANT: no OpenAI integration exists anywhere in this migration set.
-- ai_conversations/ai_messages exist purely as storage shape — a place for
-- a future AI enrichment layer (see docs/future-ai-integration.md on
-- worktree-sprint-3) to persist a conversation, once one exists. Nothing
-- here calls an LLM, defines a prompt, or grants network access.

create table knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  -- null = a ClouDonna-published article, visible platform-wide once
  -- published_at is set. not null = an organization's own private note.
  organization_id uuid references organizations (id) on delete cascade,
  title text not null,
  slug text not null,
  body text,
  category text,
  embedding vector(1536),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null,
  constraint knowledge_articles_title_not_blank check (btrim(title) <> '')
);

comment on table knowledge_articles is
  'Long-form reference content — methodology explainers, glossary entries, "how Donna Score works" — same hybrid global/org pattern as decision_frameworks. published_at null means draft/unpublished, regardless of who owns it.';

create unique index knowledge_articles_org_slug_key
  on knowledge_articles (coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), slug)
  where deleted_at is null;
create index knowledge_articles_org_idx on knowledge_articles (organization_id) where deleted_at is null;
create index knowledge_articles_embedding_idx on knowledge_articles using hnsw (embedding vector_cosine_ops);
create index knowledge_articles_created_by_idx on knowledge_articles (created_by);
create trigger knowledge_articles_set_updated_at before update on knowledge_articles for each row execute function set_updated_at();

alter table knowledge_articles enable row level security;
create policy knowledge_articles_select_published on knowledge_articles
  for select using (deleted_at is null and organization_id is null and published_at is not null);
create policy knowledge_articles_select_org on knowledge_articles
  for select using (deleted_at is null and organization_id is not null and is_org_member(organization_id));
create policy knowledge_articles_insert_org on knowledge_articles
  for insert with check (organization_id is not null and is_org_member(organization_id));
create policy knowledge_articles_update_org on knowledge_articles
  for update using (deleted_at is null and organization_id is not null and is_org_member(organization_id));

-- ---------------------------------------------------------------------------

create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  decision_session_id uuid references decision_sessions (id) on delete set null,
  user_id uuid not null references users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid references users (id) on delete set null
);

comment on table ai_conversations is
  'A conversation thread, optionally attached to a decision_session (e.g. "ask about this recommendation"). Empty today — created by nothing in this migration set — but present so the eventual AI enrichment layer has a place to persist state on day one rather than bolting tenancy/RLS on after the fact.';

create index ai_conversations_org_idx on ai_conversations (organization_id) where deleted_at is null;
create index ai_conversations_session_idx on ai_conversations (decision_session_id) where deleted_at is null;
create index ai_conversations_user_idx on ai_conversations (user_id) where deleted_at is null;
create index ai_conversations_created_by_idx on ai_conversations (created_by);
create trigger ai_conversations_set_updated_at before update on ai_conversations for each row execute function set_updated_at();

alter table ai_conversations enable row level security;
create policy ai_conversations_select on ai_conversations
  for select using (deleted_at is null and is_org_member(organization_id));
create policy ai_conversations_insert on ai_conversations
  for insert with check (is_org_member(organization_id));
create policy ai_conversations_update on ai_conversations
  for update using (deleted_at is null and is_org_member(organization_id));

-- ---------------------------------------------------------------------------

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  ai_conversation_id uuid not null references ai_conversations (id) on delete cascade,
  role ai_message_role not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  created_by uuid references users (id) on delete set null
);

comment on table ai_messages is
  'One message in a conversation. No updated_at/deleted_at, unlike most tables here: a sent message is immutable, same reasoning as audit_logs — see docs, "Soft deletes: where they do and don''t apply".';

create index ai_messages_conversation_idx on ai_messages (ai_conversation_id);
create index ai_messages_embedding_idx on ai_messages using hnsw (embedding vector_cosine_ops);
create index ai_messages_org_idx on ai_messages (organization_id);
create index ai_messages_created_by_idx on ai_messages (created_by);

alter table ai_messages enable row level security;
create policy ai_messages_select on ai_messages
  for select using (
    is_org_member(organization_id)
    and exists (
      select 1 from ai_conversations c
      where c.id = ai_messages.ai_conversation_id
        and c.deleted_at is null
    )
  );
create policy ai_messages_insert on ai_messages
  for insert with check (is_org_member(organization_id));
