-- ClouDonna Platform — Sprint 6.2
-- Migration: append_decision_version()
--
-- The second, and by design the only other, write path capable of
-- creating a decision_versions row. save_decision() (Sprint 6.1)
-- creates a decision AND its first version atomically, for a decision
-- that does not yet exist. append_decision_version() creates version
-- N+1 for an ALREADY-EXISTING decision, atomically repointing
-- current_version_id — this is Sprint 6.2's core versioning capability
-- (Slice C, docs/implementation/sprint-6.2-plan.md). Purely additive:
-- nothing about save_decision()'s own behavior, or the RLS policies
-- both functions rely on, changes here.

-- security invoker, explicitly, for the same reason save_decision()
-- states it: this function has no elevated privilege of its own. Every
-- statement inside it is still evaluated against the RLS policies
-- already in place — its only job is atomicity (a version can never be
-- created without current_version_id being repointed to it in the same
-- transaction), never a privilege escalation. See
-- docs/roadmap/02-engineering-operating-model.md, "Never weaken RLS for
-- convenience."
--
-- Concurrency: the parent decisions row is locked (select ... for
-- update) before computing the next version_number. A second,
-- concurrent append to the SAME decision blocks here until the first
-- transaction commits or rolls back — this is what prevents two
-- concurrent appends from both computing the same "next"
-- version_number, not just relying on the unique index to reject one of
-- them after the fact. Appends to a DIFFERENT decision are never
-- blocked by this lock, since it's scoped to one decisions row.
-- decision_versions_decision_version_number_key (Sprint 6.1) remains
-- the hard backstop — this lock is what makes that backstop never
-- actually need to fire in normal operation, not the sole correctness
-- mechanism.
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
  p_change_reason text
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
  -- RLS still applies to this select: a caller who is not a member of
  -- the decision's organization gets zero rows here, exactly as any
  -- other RLS-filtered read would, so this function cannot be used to
  -- probe whether a decision_id exists outside the caller's access —
  -- the same "not found or not accessible" indistinguishability
  -- decisions-repository.ts's read paths already guarantee.
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
    schema_version, scoring_engine_version, knowledge_base_version, generated_at, created_by, change_reason
  ) values (
    p_decision_id, v_organization_id, v_next_version_number, p_decision_input, p_deterministic_output,
    p_enrichment, p_provider_metadata, p_fallback_metadata, p_evidence_references,
    p_schema_version, p_scoring_engine_version, p_knowledge_base_version, now(), auth.uid(), p_change_reason
  )
  returning id into v_version_id;

  -- Evaluated against decisions_update's RLS check and the
  -- decisions_check_current_version_match trigger (Sprint 6.1
  -- stabilization) — that trigger is exactly what guarantees
  -- v_version_id (just inserted for p_decision_id above, in this same
  -- transaction) cannot end up pointed at from any other decision.
  update decisions set current_version_id = v_version_id where id = p_decision_id;

  return query select v_version_id, v_next_version_number;
end;
$$;

comment on function append_decision_version is
  'Atomic creation of decision_versions row N+1 for an already-existing decision, plus the current_version_id repoint. The only write path Sprint 6.2''s versioning capability uses — see apps/web/src/components/donna-ai/persistence/decisions-repository.ts. Fails as a whole (no partial state) if the caller is not a member of the decision''s organization, since every internal statement is still RLS-checked.';
