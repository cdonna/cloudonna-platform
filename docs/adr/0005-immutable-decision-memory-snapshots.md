# ADR-0005 — Preserve immutable Decision Memory snapshots

**Status:** Accepted. **In force today** for `decision_versions`; the
evidence-content snapshot layer is designed, not built.

**Date:** 2026-11-16

## Context

`decision_versions` is already append-only by construction: no `updated_at`,
no `deleted_at`, and no UPDATE or DELETE policy for any regular role. Its own
table comment states the reason — *"a historical record that can be edited is
not a historical record."*

What it does not yet capture is **what the cited evidence said at the time**.
`evidence_references_json` records which evidence a version cited; if a vendor
silently edits a documentation page, the reference still resolves — to
different content. The historical record then describes a decision made on
evidence that no longer exists, and does not know it.

## Decision

Historical decision snapshots are immutable, and the immutability extends to
evidence **content**, not just evidence references.

Three invariants:

1. **A historical snapshot is never mutated.** Not corrected, not enriched,
   not re-hashed. A correction is a new version with a `change_reason`.
2. **A snapshot is self-contained.** Reading a 2027 decision must not depend
   on a 2029 catalog row still existing or still meaning the same thing.
3. **Every snapshot carries its engine stamps** — `schema_version`,
   `scoring_engine_version`, `knowledge_base_version`. Without them, replay is
   undefined.

`memory.evidence_snapshots` pins evidence by `content_hash`, with the raw
bytes retained in `raw.*` under the same hash.

## Consequences

**Gained.** "What did we know then?" becomes a lookup rather than an
argument, and a silent upstream edit becomes *detectable* — a hash mismatch
is the signal that drives the "Evidence updated" event in Decision Memory.

Replay becomes well-defined, which is what makes "would this still hold
today?" computable rather than a judgement: the pinned input is re-run
through the **recorded** engine version against evidence resolved as of a
chosen time. Replaying at today's engine version instead would conflate "the
world changed" with "we changed how we weigh things," reporting a model
improvement as a world event — so that is a separate, explicitly-labelled
operation.

**Cost, and it is real.** Every scoring engine version must remain
executable, so engine versions are retained rather than replaced. Raw source
bytes must be retained to make hashes meaningful. Both are the price of the
product's central claim, and both are cheap in object storage and expensive
in discipline.

**Rejected.** "Update the snapshot when we find a better source." This is
the convenient option and it destroys the only thing Decision Memory is for.
A better source is new evidence, which produces a new version, which is
exactly what `change_reason` exists to record.

**Also rejected.** Defaulting an un-replayable decision to "recommendation
still holds." Where evidence is missing or superseded beyond threshold, the
result is **"decision requires review"** — never "holds". `confidence:
"INSUFFICIENT"` exists in the evidence model for this case.
