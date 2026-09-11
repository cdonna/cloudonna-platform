# Donna Trust Framework

**Status:** Product principles, consolidated. Every mechanism cited here
already exists in the codebase as of Sprint 5.1 unless explicitly marked
"proposed" — this document's job is to name the framework the mechanisms
already form, not to invent new ones.

## Why a trust framework, not a feature list

Every product claims to be trustworthy. Almost none can point to a
specific mechanism — a type that structurally can't hold a fabricated
number, a database policy that structurally can't be bypassed by a
sales relationship — as the reason. This document exists to make ClouDonna
the second kind: every claim below is followed by the actual thing that
makes it true, not just a statement of intent.

## Vendor neutrality

**Claim:** No vendor, partner, or commercial relationship can influence a
recommendation.

**Mechanism:**
- The vendor/product catalog (`vendors`, `products` tables, Sprint 4) has
  no `organization_id` — it is not owned by any tenant, including
  ClouDonna's own commercial relationships.
- Row Level Security on those tables has **zero** INSERT/UPDATE policies
  for any role except `service_role` — confirmed by direct scan during
  the Sprint 4 quality gate, not asserted from memory.
- Every platform is scored on the same ten weighted dimensions
  (`SCORE_WEIGHTS`, Sprint 3) — there is no per-vendor override, no
  sponsored-placement field, no "featured" flag anywhere in the schema.
- The public `/independence` page (Web Presence Sprint) states this in
  precise, legally-careful language ("designed for vendor-neutral
  analysis," not an unverifiable "we are certified independent" claim the
  company's current structure can't back up).

## Explainability

**Claim:** Every conclusion shows its reasoning.

**Mechanism:** see `donna-explain.md` in full — the eight-question
standard, seven of eight questions already backed by real, populated
fields as of Sprint 5.1.

## Evidence-first

**Claim:** A polished narrative never overrides structured evidence.

**Mechanism:**
- `IntelligenceEnrichment` (Sprint 5.1) has no field capable of holding a
  score — checked at three independent layers (type shape, Zod `.strict()`
  schema, and a content-level scan for numeric claims that don't match a
  real computed score).
- The narrative layer (`IntelligenceProvider`) only ever *narrates*
  `EvidencePackage` contents it was handed — it cannot introduce a risk,
  opportunity, or capability the deterministic engine didn't already
  identify. Verified by test (`orchestrator.test.ts`, the fabricated-score
  and unknown-evidence-reference test cases).
- If a narrative response fails validation for any reason, the system
  falls back to the deterministic result — never a partially-trusted
  blend. See `docs/intelligence/fallback-and-failure-model.md`.

## Human decision authority

**Claim:** Donna recommends. The user decides.

**Mechanism:** this is currently a design principle without a structural
enforcement — worth naming honestly. Nothing in the codebase today
*executes* a decision Donna makes (there is no auto-provisioning, no
one-click purchase, no workflow that acts on a recommendation without a
human in the loop) — but that's an absence of a feature, not a
protection. As soon as any action-taking capability is proposed (e.g. an
integration that could initiate a vendor contact, a procurement workflow),
this principle needs a real mechanism, not just a sentence. Flagged here
as a standing constraint on future scope, not a solved problem.

## Transparency

**Claim:** The user always knows what's illustrative, what's real, and
what's AI-generated.

**Mechanism:**
- "Public Alpha," "Illustrative example," and "Illustrative alpha output"
  labeling, consistently applied since the Web Presence Sprint's audit
  found and fixed the one place it was missing (the homepage demo).
- `IntelligenceEnrichment.disclosure` — a fixed, provider-authored string
  stating exactly how the narrative was generated, always present, never
  optional, never model-authored (a model writing its own disclosure
  would defeat the point).
- The homepage demo's honesty fix (Web Presence Sprint) is the concrete
  precedent: a demo that always returned the same vendor regardless of
  input was found, named as a trust problem, and fixed — not shipped with
  a caveat added on top.

## Intellectual honesty

**Claim:** ClouDonna states what it doesn't know as clearly as what it
does.

**Mechanism:** `knownInformationGaps`, `missingInformation`,
`confidenceExplanation` (Sprint 5.1) — and, more broadly, a pattern
repeated throughout this project's own documentation: every sprint's docs
in this repository include a "Known limitations" section stating
specifically what's aspirational, unwired, or deferred (e.g.
`candidateArchitecturePatterns` is honestly `[]` rather than faked from a
different field). Intellectual honesty about the product's own
documentation is the same discipline as intellectual honesty in a
recommendation — this document is written under the same rule it
describes.

## Confidence model

**Claim:** Confidence is a computed signal, not a vibe.

**Mechanism:** `computeConfidence()` (Sprint 2) — a function of input
completeness (how many of the four wizard sections were filled) and
signal quality (whether the top-ranked platform actually had positive
evidence on key dimensions, not just a non-zero score). Bounded
30-96%, never 0% (a genuinely empty input still produces *a* result,
honestly labeled low-confidence) and never 100% (no input is ever
"perfectly" complete). `confidenceExplanation` (Sprint 5.1) is the
mechanism that turns the number into an argument — see
`donna-explain.md`, question 8.

## AI disclosure

**Claim:** The user always knows when AI produced what they're reading.

**Mechanism:** every `DecisionReport.enrichmentStatus` value (`ok`,
`disabled`, `timeout`, `rate_limited`, `unavailable`, `invalid_output`) is
designed to be user-visible, not just an internal flag — and the required
UI behavior (Sprint 5 Phase 1 architecture, §14) is to show the
deterministic result *with a visible disclosure*, never to hide the fact
that enrichment didn't happen. No AI provider is integrated as of this
document (Sprint 5.1 ships deterministic-only) — meaning today, 100% of
Donna's output carries a "no AI model was used" disclosure by construction,
not by choice.

## How this framework fails safely

Every mechanism above degrades to the deterministic, evidence-only path
when it can't be satisfied — never to a weaker but "good enough" version
of itself. There is no partial-trust state in this system by design:
either every check passes and the user sees an enriched result with
correct disclosure, or one check fails and the user sees the full
deterministic result with an honest "enrichment unavailable." The
framework's actual guarantee is narrower and more honest than "ClouDonna
is always right" — it's "ClouDonna never shows you something it can't
account for."
