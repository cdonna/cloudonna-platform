/**
 * Challenger Orchestrator — composition root, mirrors
 * intelligence/orchestrator.ts and research/research-orchestrator.ts:
 * one module sequences deterministic-then-AI-assisted and owns the
 * fallback decision. Deterministic challenges always run and are
 * always returned, even when no AI provider is configured or the call
 * fails — "Challenge Recommendation" never goes silent just because
 * AI is unavailable (brief's own graceful-degradation rule, applied
 * here too).
 */
import { buildDeterministicChallenges } from "./deterministic-challenges";
import type { ChallengerProvider, ChallengerContext } from "./provider";
import type { DecisionChallenge } from "./types";
import type { EngineResult } from "../recommendation";
import type { BusinessCaseOptionInput, BusinessCaseOutput } from "../business-case/types";

export interface RunChallengeInput {
  engineResult: EngineResult;
  businessCase?: BusinessCaseOutput | null;
  businessCaseRawInputsByOption?: Map<string, BusinessCaseOptionInput>;
}

export interface RunChallengeOutput {
  challenges: DecisionChallenge[];
  aiStatus: "ok" | "disabled" | "unavailable" | "timeout" | "invalid_output";
}

function toDecisionChallenges(aiChallenges: Awaited<ReturnType<ChallengerProvider["generateChallenges"]>>): DecisionChallenge[] {
  if (aiChallenges.status !== "ok") return [];
  return aiChallenges.challenges.map((c, index) => ({
    id: `ai-${c.type}-${index}`,
    type: c.type,
    target: c.affectedOptionId ?? "recommendation",
    statement: c.statement,
    severity: c.severity,
    evidenceReferences: [],
    affectedOption: c.affectedOptionId,
    affectedCriterion: c.affectedCriterion,
    suggestedValidation: c.suggestedValidation,
    status: "open" as const,
    source: "ai-assisted" as const,
  }));
}

export async function runChallengeSession(provider: ChallengerProvider, input: RunChallengeInput): Promise<RunChallengeOutput> {
  const deterministic = buildDeterministicChallenges(input.engineResult, input.businessCase ?? null, input.businessCaseRawInputsByOption ?? new Map());

  const winner = input.engineResult.ranking[0];
  const alternatives = input.engineResult.ranking.slice(1);
  if (!winner) return { challenges: deterministic, aiStatus: "disabled" };

  const context: ChallengerContext = {
    recommendedOptionId: winner.id,
    recommendedOptionName: winner.name,
    alternativeOptions: alternatives.map((a) => ({ id: a.id, name: a.name })),
    topEvidence: input.engineResult.evidence.filter((e) => e.type === "calculated" || e.type === "official-source").slice(0, 10).map((e) => e.claim),
    assumptions: input.engineResult.assumptions,
    risks: input.engineResult.risks.map((r) => r.text),
    existingChallengeStatements: deterministic.map((c) => c.statement),
  };

  const result = await provider.generateChallenges(context);
  const aiChallenges = toDecisionChallenges(result);

  return { challenges: [...deterministic, ...aiChallenges], aiStatus: result.status };
}
