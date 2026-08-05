# Future AI Integration

**Module:** `apps/web/src/components/donna-ai/decision-engine.ts`

## What ships this sprint

Exactly one thing: an interface. No API keys, no network calls, no environment variables, no
LLM package, no external service — all explicitly out of scope for this sprint by instruction,
and none are present anywhere in this module.

```ts
export interface RecommendationProvider {
  readonly id: string;
  readonly label: string;
  generate(state: WizardState): Promise<DecisionOutput> | DecisionOutput;
}

export interface DecisionEngine {
  readonly activeProvider: RecommendationProvider;
  run(state: WizardState): Promise<DecisionOutput> | DecisionOutput;
}
```

The current deterministic engine (`engine.ts` → `buildDecisionOutput`) is wrapped as
`deterministicRecommendationProvider` and is the only provider that exists. `DonnaAIExperience`
calls `decisionEngine.run(state)` rather than `buildDecisionOutput(state)` directly — a small
indirection today, but the point at which a future provider swap happens without touching the
orchestrator.

## Why this is enough of a seam

Every component under `ResultPanel/` depends on the shape of `DecisionOutput` — never on how it
was produced. `RecommendationProvider.generate()` returns exactly that shape. This means a
future provider can be introduced by:

1. Implementing `RecommendationProvider` (new `id`, `label`, and a `generate()` that returns a
   `DecisionOutput` — however it gets there).
2. Pointing `decisionEngine.activeProvider` at it (or extending `DecisionEngine` to select
   between providers, e.g. by an environment flag).

No changes to `DonnaAIExperience`, `ResultPanel`, or any tab component are required.

## How a real LLM-backed provider would plug in later

Illustrative only — none of this is implemented, and it must not be treated as a checklist to
start on without a separate, explicit decision to do so:

```ts
// NOT implemented. Illustrative shape only.
class OpenAIRecommendationProvider implements RecommendationProvider {
  id = "openai-v1";
  label = "Donna AI (OpenAI-backed)";

  async generate(state: WizardState): Promise<DecisionOutput> {
    // 1. Serialize `state` into a prompt (or structured tool call).
    // 2. Call the model — this is where an API key and network call would
    //    first appear in this codebase; today there are none.
    // 3. Parse the response into the exact DecisionOutput shape — likely
    //    via structured output / function calling against this file's
    //    types, not free-text parsing.
    // 4. Return it. The UI does not know or care that this happened.
  }
}
```

The same pattern applies to Anthropic, SAP AI Core, or any other provider — implement the
interface, decide how `state` becomes a prompt and how the response becomes a `DecisionOutput`,
and the rest of the app is unaffected.

## What would need to change before that's real

None of this ships now — listed so the seam's boundaries are honest about what it does and
doesn't solve:

- A backend or serverless function to hold the API key (never in client-side code).
- Environment variable / secrets handling.
- Error handling for a call that can fail, time out, or return malformed output — the
  deterministic engine can't do any of those things today, so none of the current UI (loading
  states, error states) accounts for them.
- A decision on whether the deterministic engine remains available as a fallback or a
  user-facing choice, or is fully replaced.
- Validation that the LLM's output actually conforms to `DecisionOutput` before it reaches the
  UI — the deterministic engine gets this for free from TypeScript; an LLM response does not.

## Known limitations

- `DecisionEngine.run()` currently only ever calls its single `activeProvider` — there's no
  provider-selection logic yet because there's only one provider. Extending it to choose between
  providers is straightforward but intentionally not built ahead of having a second provider to
  choose between.
