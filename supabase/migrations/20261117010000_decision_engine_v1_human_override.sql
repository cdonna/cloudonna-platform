-- ClouDonna Platform — Decision Engine V1
-- Migration: human_override_json on decision_versions
--
-- Brief §28: a human must be able to disagree with the engine, and the
-- system must distinguish ENGINE RECOMMENDATION from FINAL HUMAN
-- DECISION — never silently rewrite one into the other. This migration
-- adds exactly one nullable column to the existing, already-immutable
-- decision_versions table (Sprint 6.1) and threads an optional
-- parameter through both of its existing write paths (save_decision,
-- append_decision_version). The engine's own recommendation
-- (deterministic_output_json) is never touched or overwritten by this
-- — a human override is recorded alongside it, as its own field, on
-- the same version row.
--
-- Purely additive: existing rows get human_override_json = null
-- (no override recorded), existing callers that omit the new named
-- parameter get the same behavior as before this migration.

alter table decision_versions add column human_override_json jsonb;

comment on column decision_versions.human_override_json is
  'Optional. When set, records a human decision that differs from (or explicitly confirms) deterministic_output_json''s recommendation for this same version — e.g. {"selectedOptionId": "...", "rationale": "..."}. Application-validated shape (HumanOverride in components/donna-ai/engine/human-override.ts), not database-enforced, same convention as every other *_json column in this table. Never written to by any trigger or function other than the two RPCs below, and never derived from deterministic_output_json — the whole point is that these two fields can disagree.';

-- ---------------------------------------------------------------------------
-- save_decision(): same body as Sprint 6.1's version, with one added
-- trailing parameter (p_human_override jsonb default null) and one
-- added column in the insert. CREATE OR REPLACE cannot add a
-- parameter to an existing function signature, so the old signature is
-- dropped first — safe here because neither function carries any
-- GRANT/REVOKE of its own (no migration in this schema has ever
-- granted or revoked EXECUTE on either function), so the default
-- Postgres behavior (EXECUTE granted to PUBLIC on creation) is
-- identical before and after this drop + recreate.

drop function if exists save_decision(uuid, uuid, uuid, text, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, text, text, text);

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
  p_change_reason text default null,
  p_human_override jsonb default null
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
    schema_version, scoring_engine_version, knowledge_base_version, generated_at, created_by, change_reason,
    human_override_json
  ) values (
    v_decision_id, p_organization_id, 1, p_decision_input, p_deterministic_output,
    p_enrichment, p_provider_metadata, p_fallback_metadata, p_evidence_references,
    p_schema_version, p_scoring_engine_version, p_knowledge_base_version, now(), auth.uid(), p_change_reason,
    p_human_override
  )
  returning id into v_version_id;

  update decisions set current_version_id = v_version_id where id = v_decision_id;

  return query select v_decision_id, v_human_id;
end;
$$;

comment on function save_decision is
  'Atomic create of a decision + its immutable version 1 + the current_version_id pointer, with an optional human override recorded alongside the deterministic output. The only write path Sprint 6.1''s API route uses — see apps/web/src/components/donna-ai/persistence/decisions-repository.ts. Fails as a whole (no partial state) if the caller is not a member of p_organization_id, since every internal statement is still RLS-checked.';

-- ---------------------------------------------------------------------------
-- append_decision_version(): same change as above, applied to Sprint
-- 6.2's append path. Locking/concurrency behavior is unchanged from
-- the original migration's own comment.

drop function if exists append_decision_version(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text, text, text, text);

create function append_decision_version(
  p_decision_id uuid,
  p_decision_input jsonb,
  p_deterministic_output jsonb,
  p_enrichment jsonb,
  p_provider_metadata jsonb,
  p_fallback_metadata jsonb,
  p_evidence_references jsonb,
  p_schema_version text,
  p_scoring_engine_version text,
  p_knowledge_base_version text,
  p_change_reason text,
  p_human_override jsonb default null
)
returns table (out_version_id uuid, out_version_number integer)
language plpgsql
security invoker
as $$
declare
  v_organization_id uuid;
  v_next_version_number integer;
  v_version_id uuid;
begin
  select organization_id into v_organization_id
    from decisions
    where id = p_decision_id
    for update;

  if v_organization_id is null then
    raise exception 'Decision not found or not accessible.';
  end if;

  select coalesce(max(version_number), 0) + 1 into v_next_version_number
    from decision_versions
    where decision_id = p_decision_id;

  insert into decision_versions (
    decision_id, organization_id, version_number, decision_input_json, deterministic_output_json,
    validated_enrichment_json, provider_metadata_json, fallback_metadata_json, evidence_references_json,
    schema_version, scoring_engine_version, knowledge_base_version, generated_at, created_by, change_reason,
    human_override_json
  ) values (
    p_decision_id, v_organization_id, v_next_version_number, p_decision_input, p_deterministic_output,
    p_enrichment, p_provider_metadata, p_fallback_metadata, p_evidence_references,
    p_schema_version, p_scoring_engine_version, p_knowledge_base_version, now(), auth.uid(), p_change_reason,
    p_human_override
  )
  returning id into v_version_id;

  update decisions set current_version_id = v_version_id where id = p_decision_id;

  return query select v_version_id, v_next_version_number;
end;
$$;

comment on function append_decision_version is
  'Atomic creation of decision_versions row N+1 for an already-existing decision, plus the current_version_id repoint, with an optional human override recorded alongside the deterministic output. The only write path Sprint 6.2''s versioning capability uses — see apps/web/src/components/donna-ai/persistence/decisions-repository.ts. Fails as a whole (no partial state) if the caller is not a member of the decision''s organization, since every internal statement is still RLS-checked.';
