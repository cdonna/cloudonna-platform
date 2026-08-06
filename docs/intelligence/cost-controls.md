# Cost and Performance Controls

**Files:** `intelligence/config.ts`, `intelligence/rate-limit.ts`, `intelligence/handle-decision-request.ts`, `app/api/donna-ai/decision/route.ts`

## Configurable provider and model

Nothing in this domain hardcodes a provider or model name except the one
documented fallback default (`DEFAULT_MODEL = "gpt-4o-mini"` in
`config.ts`, used only when `DONNA_AI_MODEL` is unset). Switching model —
including to a cheaper or more expensive one — is an environment-variable
change, not a code change. See `.env.example`.

## Token budget

`DONNA_AI_MAX_OUTPUT_TOKENS` (default 1600) is passed directly as
`max_completion_tokens` on every OpenAI request — a hard ceiling enforced
by the provider's own API, not just a target. There is no equivalent
*input*-token cap, because the input is already bounded structurally
rather than by a token count: the evidence package caps the shortlist at
3 platforms (`evidence-package.md`), and free-text notes are capped at 500
characters each after sanitization (`sanitize.ts`) — bounding the
*content* the prompt is built from is what actually controls the prompt's
size, since `prompt.ts`'s Layers A/B/D are fixed-length constants.

## Bounded evidence and output size

`ENRICHMENT_BOUNDS` (`schema.ts`) caps every output field's length and
every array's item count (see the full table in `provider-boundaries.md`)
— this bounds response cost on the way out the same way the evidence
package bounds it on the way in. The deterministic provider enforces the
same bounds via `cap()`/`capList()` even though it has no cost reason to
(no network call) — kept identical so both providers are validated
against literally the same numbers, not two versions that could drift.

## Timeout and retry configuration

`DONNA_AI_TIMEOUT_MS` (default 8000ms) governs two things at once: it's
passed to the OpenAI SDK client constructor as its own request timeout,
*and* it's the value `withTimeout()` in `orchestrator.ts` races the
provider call against — so a hung request can't hold a decision open
indefinitely regardless of which layer would have caught it first.
`DONNA_AI_MAX_RETRIES` (default 1) is passed straight to the OpenAI SDK's
own retry logic — kept low deliberately, since a retried-4-times request
under a tight token budget is a worse cost/latency trade than failing
into the (free, instant) deterministic fallback.

## No full-catalog prompts, ever

The single largest avoidable cost in a system like this would be sending
an entire vendor catalog (10 platforms today, designed for thousands) on
every request. `KnowledgeProvider.buildEvidencePackage()` never does
this — the shortlist is capped at 3 platforms by
`MAX_SHORTLIST_SIZE`, enforced at the point evidence is built, before any
provider (deterministic or OpenAI) ever sees it. See
`evidence-package.md`.

## Dev mode without any provider call

`loadIntelligenceConfig()` returns `provider: "none"` whenever
`OPENAI_API_KEY` is unset or empty — `selectIntelligenceProvider()` then
returns the deterministic provider, which makes zero network calls and
costs nothing. This is the default for local development and for any
environment where the key was never configured; nothing needs to be
explicitly "disabled" — absence of a key is a complete, working, free
configuration on its own. Verified by `handle-decision-request.test.ts`:
a full request/response cycle with no key configured returns a complete
200 response.

## Usage metadata in `DecisionReport`

`provider.model` on every `DecisionReport` records which model (if any)
actually produced the enrichment — this is the seam a future cost-tracking
or billing layer would read from; no usage/token count is captured today
(the OpenAI SDK response's own `usage` field is not currently persisted or
surfaced anywhere) since there is nowhere to persist it yet and no billing
system this sprint. Adding it later means reading one more field off the
already-received API response — not a new integration.

## Future plan/quota seam — not implemented

There is no concept of a plan, quota, or per-organization spending limit
anywhere in this codebase, and none is added by this sprint (explicitly
out of scope — no billing implementation). The one thing that *does* exist
as a seam for this: `RateLimiter.checkAndConsume(key)` takes an arbitrary
string key — today that key is the caller's `x-forwarded-for` header
(`route.ts`'s `getRateLimitKey`), but nothing about the interface assumes
that; a future quota system could pass an `organizationId` as the key
instead, with zero change to `orchestrator.ts` or the rate-limiter
interface itself.

## The actual rate limiter wired in today

`handle-decision-request.ts` constructs one module-scoped
`createInMemoryRateLimiter({ maxPerWindow: 20, windowMs: 60_000 })` — 20
requests per rolling-reset 60-second window, per key. This is real and
enforced (a 21st request in the same window within the same process
receives a 429), but explicitly **not** a production-grade multi-instance
control: the count lives in a `Map` in process memory, which means it
resets on every cold start and is not shared across concurrent Vercel
serverless invocations. It is a genuine defense against a single
runaway client hitting a single warm instance repeatedly, and a clearly
documented gap against a distributed attacker — see `rate-limit.ts`'s own
doc comment and `security-and-privacy.md`, "Abuse / rate-limiting seam."

## No billing implementation

Confirmed absent, per the sprint's explicit scope: no Stripe integration,
no usage-based charge, no plan enforcement. `provider.model` and the seam
described above are the only preparation for a future billing layer —
deliberately minimal, since designing real billing without a real
customer/plan model would be speculative work this sprint was told not to
do.
