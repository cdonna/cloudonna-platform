# Security and Privacy

**Scope:** everything under `intelligence/`, `app/api/donna-ai/decision/route.ts`.

This document states what is actually enforced, what is a seam for later,
and — explicitly — what is **not** claimed. It exists so a future reviewer
doesn't have to reverse-engineer the security posture from the code.

## Server-only boundary

`config.ts`, `select-provider.ts`, and `providers/openai-provider.ts` each
start with `import "server-only"`. This is a build-time guarantee, not a
convention: a client component that transitively imports any of them
fails the Next.js build outright. Verified beyond trusting the package's
own claim — after a real `npm run build`, `.next/static` was grepped
directly for `OPENAI_API_KEY` and for any OpenAI SDK call, and both came
back with zero matches in any client-side chunk.

`OPENAI_API_KEY` is read in exactly one place (`config.ts`,
`loadIntelligenceConfig`), never logged, never included in an
`IntelligenceError`, never included in an `AuditEvent`, and never appears
in a `DecisionReport`'s `provider.model` field (which carries only the
model name, e.g. `"gpt-4o-mini"` — never the key).

## Input normalization and size limits

Two independent bounds, serving different purposes (see
`fallback-and-failure-model.md`, "Excessive input," for the full
rationale):

- `decisionInputSchema` (`schema.ts`) rejects a request outright — throws,
  not a degraded report — if a free-text note exceeds 20,000 characters.
  This is the abuse ceiling: a request this large isn't a real business
  input.
- `sanitize.ts`'s `MAX_NOTE_LENGTH` (500 characters) truncates, rather than
  rejects, anything smaller than the ceiling but larger than a reasonable
  product input, before it ever reaches an evidence package or a prompt.

Neither bound is a token-budget control specifically — see
`cost-controls.md` for how the request as a whole stays within
`DONNA_AI_MAX_OUTPUT_TOKENS`.

## Prompt-injection and output-injection resistance

Covered in full in `prompt-architecture.md`, "Injection posture." Summary:
flag-don't-strip at the input layer, explicit data-vs-instruction framing
in the prompt (twice — once generally, once at the point of use), a
`.strict()` schema that rejects any unexpected output field, and
content-level claim validation (`findUnsupportedNumericClaims`,
`findUnsupportedVendorMentions`) that doesn't depend on the model having
been "convinced" of anything.

## Unsafe rendering

`intelligenceEnrichmentSchema` does not attempt HTML sanitization — by
design, per `security.test.ts`'s explicit test that `<script>...</script>`
inside a narrative field parses successfully as inert text. Escaping is
React's job, at render time, in `IntelligenceTab.tsx`, which contains no
`dangerouslySetInnerHTML` anywhere (verified by direct inspection of the
file, since this is a rendering guarantee a domain-layer unit test can't
itself exercise without adding a DOM-testing dependency — see
`testing-strategy.md` for why that dependency wasn't added this sprint).

## Data minimization

The OpenAI provider never receives the full vendor catalog, never
receives raw `WizardState` fields not already summarized into the
evidence package, and never receives anything from Supabase (this domain
imports nothing from `packages/database` — see
`donna-intelligence-architecture.md`, "Database boundary"). The evidence
package itself is capped to a 3-platform shortlist — see
`evidence-package.md`, "Why only three platforms" — both a privacy control
and a cost control simultaneously.

## Organization / tenant isolation

**Not applicable yet, and this is stated plainly rather than glossed
over.** No authentication exists in this domain (deliberately out of
scope for Sprint 5 — see the sprint brief's out-of-scope list). There is
therefore no `organizationId` to isolate by, and no persisted
`DecisionReport` for one organization to leak into another's view. The
Sprint 4 database layer's RLS policies (`packages/database`,
`supabase/migrations/`) already exist and are keyed on `auth.uid()` —
they have nothing to authorize against today because nothing in this
domain writes to those tables. `security.test.ts` carries an explicit
`it.skip` placeholder for the cross-tenant-read test, intentionally not
deleted, so this gap isn't silently forgotten once auth exists.

## Redaction seam

There is no PII redaction step in this pipeline today, because
`WizardState` (today's only real input) does not collect PII — it collects
company size bands, industry categories, and goal selections, not names,
emails, or free-text business documents. The two free-text note fields
(`constraints.note`, similar wizard note fields) are the only place a user
could paste something sensitive; they flow into the evidence package and
prompt as-is. This is disclosed, not hidden: if the wizard is ever
extended to collect real customer-identifying free text, a redaction pass
would need to sit between `sanitize.ts` and evidence-package construction
— the seam for it is `sanitize.ts` itself, already the single choke point
every free-text field passes through.

## Audit metadata

Every `createDecision()` call emits exactly one `AuditEvent` via
`config.auditSink` (default `noopAuditSink` — no sink is wired to any
actual log service or database this sprint). The event is metadata only:
timestamp, `providerId`, `model`, `enrichmentStatus`, note *counts* and
*lengths* (never content), shortlist size, a boolean for whether any note
was flagged as instruction-like, and call duration. No prompt text, no
evidence content, no provider response — ever — is included. This is
enforced by the `AuditEvent` type itself having no string field wide
enough to hold prose (see `audit.ts`).

## Safe error responses

`handle-decision-request.ts` returns exactly two possible error bodies —
`"Request body must be a JSON object with a wizardState field."` (400),
`"The request could not be processed."` (400), or `"Too many requests.
Please try again shortly."` (429) — never a Zod validation message, stack
trace, or provider error string. `handle-decision-request.test.ts`
includes a direct regex assertion (`/zod|schema|stack/i`) that no error
response ever contains those words. Malformed input and a rate-limit
rejection are deliberately made to look alike from a 400-vs-429 status
code alone — no response body hints at which internal check actually
fired, so a client probing the endpoint learns nothing about validation
internals.

## Abuse / rate-limiting seam

See `cost-controls.md` for the full account. Summary: a real, working
in-memory fixed-window limiter (`createInMemoryRateLimiter`) is wired into
the actual API route today (20 requests/minute per `x-forwarded-for`
value), explicitly documented as not safe across multiple server
instances — a seam for a real distributed limiter, not a claim that one
exists.

## What this document does not claim

- **Not GDPR-compliant, and no claim of compliance is made.** There is no
  documented lawful basis for processing, no data-subject access/erasure
  flow, no data-processing agreement with OpenAI on file in this
  repository, and no retention policy — none of that is in scope for an
  engineering sprint to establish unilaterally. Remaining work, before any
  real customer data reaches this pipeline: legal review of the OpenAI API
  data-usage terms actually in effect for the account used, a documented
  retention/deletion policy, and a real basis-for-processing decision —
  all outside engineering's authority to close.
- **Not a production authentication system.** No login, no session, no
  `organizationId`.
- **Not resistant to a determined, sophisticated prompt-injection
  attacker.** The defenses here (flagging, structural framing, schema
  strictness, claim validation) are real and tested against realistic
  cases, but no LLM-facing system available today is provably immune to
  every injection technique. The design goal is containment — even a
  successful injection cannot reach a score, a ranking, or an
  out-of-shortlist vendor claim — not prevention of the model ever being
  confused.
- **Not a substitute for a WAF, DDoS protection, or infrastructure-level
  rate limiting.** The in-memory limiter is an application-level abuse
  seam, not a network-layer defense.
