/**
 * KnowledgeProvider: turns an already-computed DeterministicDecisionOutput
 * into a bounded EvidencePackage. Every value here is selected or
 * relabeled from fields the scoring engine already produced — this module
 * computes nothing, matches nothing, and scores nothing. See
 * docs/intelligence/evidence-package.md.
 */
import { EMPLOYEE_OPTIONS, GOAL_OPTIONS, INDUSTRY_OPTIONS } from "../data";
import type { RankedPlatform } from "../scoring/types";
import type { DecisionInput, DeterministicDecisionOutput, EvidencePackage, EvidencePlatform } from "./types";

/** Primary + up to two alternatives — never the full catalog. See
 * docs/intelligence/evidence-package.md, "Why only three". */
const MAX_SHORTLIST_SIZE = 3;

function optionLabel<T extends string>(options: Array<{ value: T; label: string }>, value: T | null): string | null {
  return options.find((option) => option.value === value)?.label ?? null;
}

function toEvidencePlatform(ranked: RankedPlatform): EvidencePlatform {
  return {
    id: ranked.platform.id,
    name: ranked.platform.productName,
    overallScore: ranked.overallScore,
    dimensionScores: ranked.dimensions.map((d) => ({
      key: d.key,
      label: d.label,
      score: d.score,
      weight: d.weight,
    })),
    positiveEvidence: ranked.dimensions.flatMap((d) => d.positiveEvidence),
    negativeEvidence: ranked.dimensions.flatMap((d) => d.negativeEvidence),
  };
}

export interface KnowledgeProvider {
  buildEvidencePackage(input: DecisionInput, output: DeterministicDecisionOutput): EvidencePackage;
}

export const deterministicKnowledgeProvider: KnowledgeProvider = {
  buildEvidencePackage(input, output) {
    const shortlist: RankedPlatform[] = [output.recommendation, ...output.alternatives].slice(
      0,
      MAX_SHORTLIST_SIZE,
    );

    const matchedCapabilities = Array.from(
      new Set(shortlist.flatMap((ranked) => ranked.platform.integrationStrengths ?? [])),
    ).slice(0, 10);

    const candidateSolutionPatterns = Array.from(
      new Set(shortlist.map((ranked) => ranked.platform.vendorCategory)),
    );

    const candidateTechnologyPatterns = Array.from(
      new Set(shortlist.flatMap((ranked) => ranked.platform.architectureCharacteristics ?? [])),
    ).slice(0, 10);

    const sourceReferences = shortlist.map((ranked) => ({
      platformId: ranked.platform.id,
      note: ranked.platform.sourceNotes,
      reliability: "internal_review" as const,
    }));

    const knownInformationGaps = shortlist
      .filter((ranked) => ranked.dimensions.every((d) => d.positiveEvidence.length === 0))
      .map((ranked) => `Limited scoring signal for ${ranked.platform.productName} given the inputs provided.`);

    if (output.confidenceScore < 60) {
      knownInformationGaps.push(
        "Overall confidence is low — more detail in Landscape, Goals or Constraints would sharpen this result.",
      );
    }

    const wizardState = input.wizardState;

    return {
      decisionContext: {
        goals: wizardState.goals.goals
          .map((g) => optionLabel(GOAL_OPTIONS, g))
          .filter((label): label is string => label !== null),
        industry: optionLabel(INDUSTRY_OPTIONS, wizardState.company.industry),
        companySize: optionLabel(EMPLOYEE_OPTIONS, wizardState.company.employees),
      },
      shortlist: shortlist.map(toEvidencePlatform),
      matchedCapabilities,
      candidateSolutionPatterns,
      candidateTechnologyPatterns,
      // Not yet backed by real data — see types.ts, EvidencePackage.
      candidateArchitecturePatterns: [],
      sourceReferences,
      knownInformationGaps,
      deterministicRisks: output.risks.map((r) => r.text),
      deterministicOpportunities: output.opportunities.map((o) => o.text),
      deterministicAssumptions: output.assumptions.map((a) => a.text),
      deterministicNextSteps: output.nextSteps.map((s) => ({ text: s.text, horizon: s.horizon })),
      deterministicWorkshops: output.workshops.map((w) => ({ title: w.title, description: w.description })),
    };
  },
};
