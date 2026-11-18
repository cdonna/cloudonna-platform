/**
 * Evidence Quality Score (brief §40) — HIGH/MEDIUM/LOW, a deterministic
 * classification from documented inputs, never a fabricated percentage.
 * Six inputs, each already real fields on CapabilityClaim/
 * CapabilityEvidence/EvidenceSource — nothing here is a new fact,
 * only a documented way of reading the ones that already exist:
 *
 *  - source authority:  OFFICIAL_SOURCE_PRIORITY rank of each
 *                        supporting source's category
 *  - freshness:          the claim's own freshness classification
 *  - directness:         evidence confidence ("high" means the source
 *                         directly states the claim; "low" means it is
 *                         inferred)
 *  - corroboration:      how many independent sources support it
 *  - conflicts:          whether any CONTRADICTS evidence exists
 *  - scope:               private, single-customer evidence never
 *                         qualifies as HIGH on its own, since it
 *                         cannot be corroborated against a second
 *                         independent source by definition
 */
import type { EvidenceScope } from "./types";
import type { FreshnessCategory } from "./freshness-v2";
import { OFFICIAL_SOURCE_PRIORITY, type EvidenceSourceCategory } from "./types";

export type EvidenceQualityTier = "high" | "medium" | "low";

export interface QualityScoreInput {
  scope: EvidenceScope;
  freshness: FreshnessCategory;
  supportingSourceCategories: EvidenceSourceCategory[];
  supportingEvidenceConfidences: Array<"high" | "medium" | "low">;
  hasContradictingEvidence: boolean;
}

function isOfficialCategory(category: EvidenceSourceCategory): boolean {
  const rank = OFFICIAL_SOURCE_PRIORITY.indexOf(category);
  // independent_analysis and unknown sit at the back of the priority
  // list and are deliberately not treated as "official" here.
  return rank >= 0 && rank < OFFICIAL_SOURCE_PRIORITY.indexOf("independent_analysis");
}

export function computeEvidenceQuality(input: QualityScoreInput): { tier: EvidenceQualityTier; reasons: string[] } {
  const reasons: string[] = [];

  if (input.supportingSourceCategories.length === 0) {
    return { tier: "low", reasons: ["No supporting source recorded."] };
  }

  if (input.hasContradictingEvidence) {
    reasons.push("At least one source contradicts this claim.");
    return { tier: "low", reasons };
  }

  const officialCount = input.supportingSourceCategories.filter(isOfficialCategory).length;
  const independentCorroborationCount = input.supportingSourceCategories.length;
  const hasDirectEvidence = input.supportingEvidenceConfidences.includes("high");
  const isFresh = input.freshness === "current";
  const isStale = input.freshness === "stale" || input.freshness === "unknown";

  if (isStale) reasons.push(`Freshness is ${input.freshness}.`);
  if (officialCount === 0) reasons.push("No official source among the supporting evidence.");
  if (!hasDirectEvidence) reasons.push("No directly-stated (high-confidence) supporting evidence.");

  // HIGH: at least one official source, directly stated, fresh, and
  // (for anything claimed globally) genuinely corroborated by more
  // than one independent source — a single official source alone is
  // real evidence but not yet corroborated.
  if (officialCount >= 1 && hasDirectEvidence && isFresh && independentCorroborationCount >= 2 && input.scope === "global") {
    reasons.push("Corroborated by multiple sources, at least one official, directly stated, and current.");
    return { tier: "high", reasons };
  }

  // MEDIUM: at least one official source, directly stated, not stale —
  // the common, honest case for a single well-sourced claim.
  if (officialCount >= 1 && hasDirectEvidence && !isStale) {
    reasons.push("Backed by an official source, directly stated, not yet stale.");
    return { tier: "medium", reasons };
  }

  reasons.push("Evidence exists but does not yet meet the bar for medium or high confidence.");
  return { tier: "low", reasons };
}
