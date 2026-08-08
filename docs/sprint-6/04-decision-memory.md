# Sprint 6 — 04. Decision Memory

This is the record that turns a recommendation into an enterprise asset. It extends `decision_reports` (already in `main`, already append-only-capable) rather than inventing a parallel table.

## What gets persisted, and why each field earns its place

```sql
alter table decision_reports
  add column human_id text,                       -- CDD-2026-000152, display/search only
  add column status decision_report_status not null default 'draft',
  add column decision_input jsonb not null,        -- validated DecisionInput
  add column deterministic_output jsonb not null,  -- validated DeterministicDecisionOutput, byte-identical
  add column enrichment jsonb,                     -- validated IntelligenceEnrichment, nullable
  add column evidence_references text[] not null default '{}',
  add column provider_id text not null,
  add column provider_model text,
  add column fallback_status text not null,
  add column fallback_reason text,
  add column architecture_summary text,            -- narrative: which architecture pattern this decision follows
  add column rationale text,                       -- why this decision, in the reviewer's own words
  add column assumptions text[],
  add column risks text[],
  add column schema_version text not null,         -- e.g. "decision-report/1"
  add column scoring_engine_version text not null, -- e.g. "donna-score-v2"
  add column knowledge_base_version text not null, -- vendor catalog snapshot identifier
  add column version_number integer not null default 1,
  add column is_current_version boolean not null default true,
  add column decision_session_version_of uuid references decision_reports (id) on delete set null;
```

Every field is either (a) already validated Sprint 5 domain data, copied verbatim, or (b) provenance metadata that makes Decision Replay (`07-replay.md`) an honest answer instead of a guess. Nothing here is speculative structure added for its own sake — `architecture_summary`, `rationale`, `assumptions`, `risks` exist specifically because the mission brief names them as things Decision Memory must preserve, and they map directly onto fields the deterministic engine and enrichment layer already produce (`DecisionOutput.risks`/`.assumptions`, the AI layer's narrative fields) — this is a persistence target for facts that already exist today, not new facts invented for the database.

## Human-readable Decision ID

`human_id`: format `CDD-{year}-{sequence}`, e.g. `CDD-2026-000152` — a global sequence (not per-organization), so the ID is unambiguous even quoted out of context (a support email, a meeting). It routes nowhere and authorizes nothing on its own — every load re-checks RLS against the real UUID. It exists purely so a human can say a decision's name out loud.

```sql
create sequence decision_human_id_seq;
-- assigned via a before-insert trigger, formatted from created_at's year —
-- exact SQL is an implementation detail, not an architecture commitment.
```

## Provenance — why replay can be honest instead of hand-wavy

`schema_version`, `scoring_engine_version`, `knowledge_base_version` are simple hand-maintained string constants, bumped whenever their respective layer changes in a scoring-relevant way. This is a real, disclosed operational discipline requirement — a machine can't reliably judge "was this change scoring-relevant," so a developer must remember to bump the constant. Without these three fields, "would this recommendation differ today" is a guess; with them, it's a diff against a known, named baseline.

## Timestamps

`created_at`/`updated_at` (already on `decision_reports`), plus every lifecycle transition additionally recorded as an `audit_logs` event (see `06-timeline.md`) — timestamps live in two places on purpose: the row for "when was this version created," the audit trail for "when did every subsequent thing happen to it."

## What Decision Memory deliberately does not store

- **Raw OpenAI responses.** Never — `enrichment` is the validated `IntelligenceEnrichment` object, which structurally has no field wide enough to hold a raw SDK response. See `08-security.md`.
- **Raw prompts.** Never, by default — same structural argument.
- **A denormalized copy of the vendor catalog.** `evidence_references` are ids; the catalog itself is not snapshotted per decision (a disclosed limitation of Decision Replay, not solved here — see `07-replay.md`).

## What this document does not decide

- Whether `decision_input`/`deterministic_output` are stored once per version or diffed against the prior version. **Recommendation: once per version** — `jsonb` storage is cheap; diffing is complexity this scale doesn't need yet.
