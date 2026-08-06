# Testing Strategy

**Location:** `apps/web/src/components/donna-ai/intelligence/__tests__/`
**Run:** `npx vitest run src/components/donna-ai/intelligence/__tests__` (from `apps/web`)
**Current state:** 13 files, 92 tests passing, 1 intentionally skipped, 0 requiring a network connection or API key.

## Why this domain is fully testable without a live provider

Every function that touches the network (`providers/openai-provider.ts`)
is a thin, isolated boundary around the OpenAI SDK client — the prompt
that gets sent (`prompt.ts`), the config that selects a provider
(`config.ts`, `select-provider.ts`), the validation that gates a response
(`schema.ts`), and the fallback logic that handles any failure
(`orchestrator.ts`) are all pure or dependency-injected, and are tested
directly. The SDK call itself is mocked. This is a deliberate architecture
choice, not a testing afterthought — see `donna-intelligence-architecture.md`.

## Test files and what each guards

| File | Tests | What it covers |
|---|---|---|
| `sanitize.test.ts` | 8 | Free-text bounding, control-char/whitespace handling, instruction-like flagging without false positives |
| `config.test.ts` | 6 | Env-var → config mapping, safe defaults on malformed input, no unrelated env leakage |
| `schema.test.ts` | 12 | Zod bounds, `.strict()` rejecting unexpected fields (the score-override defense), evidence-reference validation, numeric-claim detection, `DecisionInput` bounds |
| `knowledge-provider.test.ts` | 5 | Shortlist cap, verbatim-copy guarantee (nothing invented), empty-input handling, score fidelity vs. the deterministic output |
| `prompt.test.ts` | 7 | Message shape, presence of every non-negotiable rule, shortlist-only platform mentions, notes labeled as data, pure-function determinism |
| `deterministic-provider.test.ts` | 6 | Always succeeds, schema-valid, evidence-grounded, non-stub output |
| `security.test.ts` | 5 | Prompt injection (free-text and evidence-channel), unsafe-rendering content, unsupported-vendor-claim guard, cross-tenant placeholder (skipped, see below) |
| `orchestrator.test.ts` | 18 | The full fallback matrix, rate-limiting, audit emission, output immutability, provider interchangeability |
| `select-provider.test.ts` | 3 | Config → concrete provider selection, including the defensive misconfiguration case |
| `handle-decision-request.test.ts` | 6 | HTTP-adjacent validation, safe error bodies, end-to-end no-key flow, rate-limit integration |
| `openai-provider-mocked.test.ts` | 6 | Every realistic mocked SDK response shape: valid, malformed JSON, refusal, schema-invalid, empty choices, thrown error |
| `openai-provider.test.ts` | 8 | `classifyOpenAIError` against real constructed SDK error instances; provider construction never network-calls |
| `openai-provider.live.test.ts` | 1 (gated) | A real call — see below |

## Category mapping (against the sprint brief's required test list)

- **Unit:** `sanitize.test.ts`, `config.test.ts`, `schema.test.ts`, `prompt.test.ts`, `knowledge-provider.test.ts`.
- **Contract:** `deterministic-provider.test.ts`, `select-provider.test.ts` (both providers satisfy the same `IntelligenceProvider` interface — see `orchestrator.test.ts`'s "is interchangeable across providers").
- **Failure-mode:** the bulk of `orchestrator.test.ts` and `openai-provider-mocked.test.ts` — every row of the fallback matrix in `fallback-and-failure-model.md` has a corresponding test: missing API key (`orchestrator.test.ts`, "falls back cleanly ... disabled"), timeout, provider throw, provider-reported rate limit, malformed JSON, schema mismatch, unsupported evidence reference, attempted score override, fabricated vendor claim, empty evidence, low-confidence decision, excessive input length.
- **Security:** `security.test.ts` plus the injection- and claim-specific cases embedded in `orchestrator.test.ts`/`prompt.test.ts` — prompt injection (both channels: user notes and evidence content), cross-tenant placeholder, secret-leakage assertions (`openai-provider.test.ts`'s "never includes the raw SDK error message"; `handle-decision-request.test.ts`'s "error responses never contain internal validation details"), unsafe-HTML-content handling.
- **Integration:** `handle-decision-request.test.ts` (the real HTTP-adjacent path end to end, deterministic-only) and `orchestrator.test.ts`'s full-pipeline tests.
- **Mocked-provider:** `openai-provider-mocked.test.ts` — successful and invalid external-provider responses, without any real network access.
- **UI fallback rendering:** not an automated test (see "What isn't automated" below) — verified manually in the local visual review, see `sprint-5-review.md`.
- **Live-provider:** `openai-provider.live.test.ts` — optional, disabled by default, never required in CI, never needs an API key for the standard suite to pass.

## The cross-tenant test is skipped, not deleted

`security.test.ts`'s `it.skip("a request scoped to one organization
cannot read another organization's decision report", ...)` exists so the
requirement isn't silently forgotten. It cannot be implemented today
because there is no authentication and no persisted, tenant-scoped
`DecisionReport` in this domain (both explicitly out of scope for Sprint
5) — see `donna-intelligence-architecture.md`, "Known limitations," and
`security-and-privacy.md`, "Organization / tenant isolation."

## Live-provider tests — double-gated, off by default

`openai-provider.live.test.ts` is excluded from the default run two
independent ways: `vitest.config.mts`'s `exclude` pattern drops every
`**/*.live.test.ts` file unless `DONNA_AI_RUN_LIVE_TESTS` is set, *and*
the test itself wraps its one `it` in
`describe.skipIf(!process.env.OPENAI_API_KEY)`. Either gate alone would be
enough; both exist so a config-file mistake in one doesn't accidentally
let a real, billed API call run in CI. To run it deliberately:

```
DONNA_AI_RUN_LIVE_TESTS=1 OPENAI_API_KEY=sk-... npx vitest run \
  src/components/donna-ai/intelligence/__tests__/openai-provider.live.test.ts
```

## Mocking approach for the OpenAI SDK

`openai-provider-mocked.test.ts` uses `vi.mock("openai", async
(importOriginal) => {...})`, replacing only the default-exported client
class's `chat.completions.create` method with a `vi.fn()`, while
preserving every real named export (`RateLimitError`,
`APIConnectionTimeoutError`, `APIError`, etc.) via `importOriginal()`. This
matters for `openai-provider.test.ts`'s `classifyOpenAIError` tests, which
construct *real* instances of those error classes
(`new RateLimitError(429, {}, "...", new Headers())`) rather than fake
look-alike objects — an `instanceof` check against a hand-rolled mock
object would prove nothing about the real classification logic.

## What isn't automated, and why

- **`IntelligenceTab.tsx`'s actual rendering.** No React Testing Library
  / jsdom dependency was added this sprint — a new test-infrastructure
  dependency for one component's rendering wasn't judged worth it given
  the component contains no logic beyond conditional rendering of already
  schema-validated string/array fields (verified by direct inspection: no
  `dangerouslySetInnerHTML`, no computation, no state). Covered instead by
  the manual local visual review.
- **Real OpenAI response quality/tone.** Impossible to unit test
  meaningfully (a model's prose is not deterministic even at low
  temperature) — the live test asserts schema validity only, not content
  quality. Content quality is a product-review concern, not a test-suite
  concern.
- **The in-memory rate limiter's multi-instance behavior.** Not testable
  in a single test process by definition — its documented limitation *is*
  that it doesn't share state across instances (see `cost-controls.md`).
