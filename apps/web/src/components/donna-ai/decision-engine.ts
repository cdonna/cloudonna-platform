import { buildDecisionOutput } from "./engine";
import type { DecisionOutput, WizardState } from "./types";

/**
 * The seam for future AI integration. A RecommendationProvider takes a
 * completed assessment and returns a DecisionOutput — how it gets there is
 * entirely up to the implementation. The UI (ResultPanel and every tab)
 * only ever depends on DecisionOutput, never on how it was produced, so
 * swapping providers requires no UI changes.
 *
 * This sprint ships exactly one provider: DeterministicRecommendationProvider,
 * wrapping the existing rule-based engine. No network calls, no API keys,
 * no LLM package — see docs/future-ai-integration.md for how a real
 * provider (OpenAI, Anthropic, SAP AI Core, etc.) would plug in later.
 */
export interface RecommendationProvider {
  readonly id: string;
  readonly label: string;
  generate(state: WizardState): Promise<DecisionOutput> | DecisionOutput;
}

/**
 * The engine itself — currently just a thin wrapper choosing a provider.
 * Exists as a named seam so a future version could select between
 * providers (e.g. deterministic vs. LLM-backed) without the call site
 * (DonnaAIExperience) needing to know which one is active.
 */
export interface DecisionEngine {
  readonly activeProvider: RecommendationProvider;
  run(state: WizardState): Promise<DecisionOutput> | DecisionOutput;
}

export const deterministicRecommendationProvider: RecommendationProvider = {
  id: "deterministic-v2",
  label: "Donna Score v2 (deterministic)",
  generate: buildDecisionOutput,
};

export const decisionEngine: DecisionEngine = {
  activeProvider: deterministicRecommendationProvider,
  run(state) {
    return this.activeProvider.generate(state);
  },
};
