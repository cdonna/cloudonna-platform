# Sprint 5 Review — Donna Intelligence Engine

**Branch/worktree:** `worktree-sprint-5`, at `.claude/worktrees/sprint-5`
**Status at review time:** implemented, all quality gates passing, not committed

## Phases completed

| Phase | Scope | Status |
|---|---|---|
| 5.1 | Contracts, evidence model, deterministic orchestration | Done (prior review — approved) |
| 5.2 | Evidence/knowledge retrieval refinement | Done (prior review — approved) |
| 5.3 | Server-side AI provider adapter (`createOpenAIIntelligenceProvider`) | Done |
| 5.4 | Runtime validation and deterministic fallback (rate limiting, audit, vendor-mention validation) | Done |
| 5.5 | Donna result UI enrichment ("AI Insights" tab, client fallback) | Done |
| 5.6 | Security/privacy/cost/observability controls | Done |
| 5.7 | Unit/contract/integration/security tests | Done |
| 5.8 | Documentation and local visual review | Done (this document) |

## What changed since the 5.1/5.2 review

`DecisionReport` was revised from a flat shape (`enrichmentStatus`,
`enrichmentFailureReason`, `providerId` as separate top-level fields) to
two nested objects, `ProviderMetadata` and `FallbackMetadata` — a UI
always needs "which provider, and did it work" together, and the nested
shape makes that pairing explicit. This is documented as a deliberate
breaking change in `decision-report-contract.md` rather than left
implicit.

Two real gaps were found and closed during this pass, both while
cross-checking the implementation against the sprint brief's explicit
requirements rather than only against what was already planned:

1. **Fabricated vendor names weren't checked.** The original numeric-claim
   validator caught a fabricated *score* but not a fabricated *vendor
   name* (a real catalog product mentioned outside the session's
   shortlist). Closed with `findUnsupportedVendorMentions()`.
2. **`apps/web/.env.example` was silently gitignored.** The repo root's
   `.gitignore` correctly excludes `.env.example` from its `.env*` rule,
   but `apps/web/.gitignore` had the same broad pattern without the same
   exception — so the new `.env.example` this sprint needed would never
   have been committable. Fixed by adding `!.env.example` to
   `apps/web/.gitignore`.

## Quality gates — run from a cold state

```
npx tsc --noEmit         → clean, zero errors
npm run lint              → clean, zero errors/warnings
rm -rf .next && npm run build   → succeeds; /api/donna-ai/decision built as a dynamic (ƒ) route
npx vitest run             → 12 test files passed, 92 tests passed, 1 intentionally skipped
```

Ran in that order, on a fresh `.next` directory, with no environment
variables set (so the build and tests exercise the deterministic-only
path by default, the same as a real fresh clone would).

## Server-only boundary — verified, not assumed

After the real production build, `.next/static` was grepped directly:

```
grep -rl "OPENAI_API_KEY" .next/static     → 0 matches
grep -rl "chat.completions.create|OpenAI(" .next/static  → 0 matches
```

Zero occurrences in any client-side chunk — the `server-only` import
guard is backed by an actual build-output check, not just trust in the
package.

## Local review — what was exercised and how

The dev server was started on `http://localhost:3417`. Since this
environment has no headless-browser/screenshot tool available, the
review combines a live exercise of the real HTTP API with a direct
source-level check of the rendering and accessibility code — disclosed
here plainly rather than claiming a visual check that didn't happen.

- **No-key deterministic flow, live:** `POST /api/donna-ai/decision` with
  a realistic wizard state, no `OPENAI_API_KEY` set. Returned `200`,
  `provider.providerId: "deterministic-v1"`, `fallback.status: "ok"`,
  a real `donnaScore`, and an `enrichment.evidenceReferences` array
  containing exactly the three shortlisted platform ids — confirming the
  full pipeline (validate → compute → retrieve → enrich → validate →
  merge) end to end.
- **Malformed input:** a body missing `wizardState` → `400`, safe generic
  message. A non-JSON body → `400`, safe generic message. Neither leaked
  any internal detail.
- **Rate limiting, live:** 25 rapid requests with the same
  `x-forwarded-for` key against the real running server — the 21st
  through 25th each received `429`, matching the configured
  `maxPerWindow: 20`. A different key was unaffected (see
  `handle-decision-request.test.ts` for the automated version of this
  same assertion).
- **Mobile/responsive markup:** confirmed the `width=device-width,
  initial-scale=1` viewport meta tag is present, and confirmed by
  reading `IntelligenceTab.tsx` and `ResultPanel.tsx` directly that every
  multi-column layout uses `grid gap-5 lg:grid-cols-2` (collapsing to a
  single column below `lg`) with no fixed-width element that would
  overflow a narrow viewport.
- **Keyboard/accessibility markup:** confirmed by direct source
  inspection — `ResultPanel`'s tab list uses `role="tablist"`/`role="tab"`
  with `aria-selected`, `aria-controls`, and a roving `tabIndex` (via the
  existing `useRovingTabs` hook, unmodified); the unavailable-enrichment
  state uses `role="status" aria-live="polite"`; the save-decision toggle
  uses `aria-pressed`.
- **Mocked-enriched-flow:** verified via the automated
  `openai-provider-mocked.test.ts` suite (valid, malformed, refused,
  schema-invalid, empty, and thrown-error response shapes), not via a
  live browser render — standing up a mock OpenAI server for a manual
  browser session wasn't judged worth the added surface, since the
  `IntelligenceTab` component renders the exact same `IntelligenceEnrichment`
  shape regardless of which provider produced it (verified by the fact
  that the component takes a `DecisionReport`, never a provider-specific
  type).

**Recommended before sign-off:** a human visually load
`http://localhost:3417/donna-ai`, complete the wizard, and confirm the
result screen and "AI Insights" tab render as expected in an actual
browser — the checks above are strong evidence but are not a substitute
for a human looking at the rendered page.

## Known limitations (carried from the architecture doc, restated here for review visibility)

- No persistence — every `DecisionReport` is constructed and returned, never stored.
- No authentication — no `organizationId`, no tenant isolation (the cross-tenant test is `it.skip`, not deleted).
- The claim-validation heuristics are best-effort, not a guarantee.
- The in-memory rate limiter is single-instance only.
- No GDPR compliance claim — see `security-and-privacy.md` for the specific remaining legal/operational work.
- `EvidencePackage.candidateArchitecturePatterns` is always empty (Sprint 4's schema for this isn't wired to the in-memory catalog).

## Proposed Sprint 6 scope (not started, for discussion only)

- Wire a real distributed rate limiter (or an explicit decision to defer this until auth exists, since per-organization quota is a more natural control than per-IP).
- Populate `DecisionInput`'s reserved context fields (`organizationContext`, `desiredOutcomes`, etc.) once the wizard is extended to collect them.
- Decide whether `DecisionReport` persistence is worth building ahead of authentication (e.g. a short-lived, unauthenticated share link) or should wait for it.
- Extend `findUnsupportedVendorMentions`/`findUnsupportedNumericClaims` if real-world usage surfaces claim patterns the current heuristics miss.
