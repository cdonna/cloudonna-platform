/**
 * Evidence Engine (brief §10/§11) — gives the existing dimension-level
 * `positiveEvidence`/`negativeEvidence` strings (scoring/types.ts) a
 * type and a provenance, instead of inventing a parallel evidence
 * model. Reuses the exact taxonomy already shipped on the public site
 * (components/showcase/EvidenceTag.tsx's `EvidenceType`) so "evidence"
 * means the same six things everywhere in the product, not one
 * vocabulary on the marketing pages and a different one in the real
 * engine.
 *
 * Every EngineEvidence item here traces to a concrete source:
 *  - "calculated"      — a dimension score's own positive/negative text
 *                         (scoring/engine.ts already derived it).
 *  - "official-source"  — the vendor catalog's own sourceNotes +
 *                         lastReviewedDate (vendor-intelligence/catalog.ts).
 *  - "customer-input"   — a value the wizard actually collected.
 *  - "assumption"       — a wizard field the user left unanswered.
 * Nothing here is invented narrative; "ai-interpretation" items are
 * attached separately, only when an AI enrichment narrative exists, and
 * are never produced by this module (see engine/recommendation.ts).
 */
import type { EvidenceType } from "@/components/showcase/EvidenceTag";
import type { DimensionResult, RankedPlatform } from "../scoring/types";
import type { WizardState } from "../types";

export interface EngineEvidence {
  type: EvidenceType;
  claim: string;
  relatedDimension: DimensionResult["key"] | null;
  confidence: "low" | "medium" | "high";
}

function fromDimension(dimension: DimensionResult): EngineEvidence[] {
  const items: EngineEvidence[] = [];
  for (const claim of dimension.positiveEvidence) {
    items.push({ type: "calculated", claim, relatedDimension: dimension.key, confidence: "high" });
  }
  for (const claim of dimension.negativeEvidence) {
    items.push({ type: "calculated", claim, relatedDimension: dimension.key, confidence: "high" });
  }
  return items;
}

function officialSourceEvidence(ranked: RankedPlatform): EngineEvidence {
  return {
    type: "official-source",
    claim: `${ranked.platform.vendor} ${ranked.platform.productName} — curated catalog entry, last reviewed ${ranked.platform.lastReviewedDate}.`,
    relatedDimension: null,
    confidence: "medium",
  };
}

/** One assumption item per wizard field the user left unanswered — the
 * same "never silently invent" rule the brief's Context Engine (§6)
 * states, applied structurally: an unset field becomes a typed
 * ASSUMPTION evidence item, not a default value quietly standing in for
 * it anywhere in the score. */
function assumptionEvidence(state: WizardState): EngineEvidence[] {
  const items: EngineEvidence[] = [];
  const push = (claim: string) => items.push({ type: "assumption", claim, relatedDimension: null, confidence: "low" });

  if (state.company.industry === null) push("Industry was not specified — assumed not to materially affect fit.");
  if (state.company.employees === null) push("Company size was not specified — assumed not to materially affect fit.");
  if (state.landscape.cloud === null) push("Current cloud provider was not specified.");
  if (state.goals.goals.length === 0) push("No strategic goals were selected.");
  if (state.constraints.budget === null) push("Budget level was not specified.");
  if (state.constraints.timeline === null) push("Timeline was not specified.");
  if (state.constraints.riskAppetite === null) push("Risk appetite was not specified.");
  if (state.constraints.preferredVendor === null) push("Vendor preference was not specified.");
  if (state.constraints.preferredCloud === null) push("Cloud requirement was not specified.");

  return items;
}

function customerInputEvidence(state: WizardState): EngineEvidence[] {
  const items: EngineEvidence[] = [];
  const push = (claim: string) => items.push({ type: "customer-input", claim, relatedDimension: null, confidence: "high" });

  if (state.company.industry !== null) push(`Stated industry: ${state.company.industry}.`);
  if (state.company.employees !== null) push(`Stated company size: ${state.company.employees}.`);
  if (state.goals.goals.length > 0) push(`Stated goals: ${state.goals.goals.join(", ")}.`);
  if (state.constraints.budget !== null) push(`Stated budget level: ${state.constraints.budget}.`);
  if (state.constraints.timeline !== null) push(`Stated timeline: ${state.constraints.timeline}.`);

  return items;
}

/** Evidence for the top-ranked platform — calculated (per dimension) +
 * official-source (catalog provenance) + the customer-input/assumption
 * items that apply to the whole assessment regardless of which
 * platform is shown. */
export function buildEngineEvidence(state: WizardState, ranked: RankedPlatform): EngineEvidence[] {
  const calculated = ranked.dimensions.flatMap(fromDimension);
  return [calculated, [officialSourceEvidence(ranked)], customerInputEvidence(state), assumptionEvidence(state)].flat();
}

export interface EvidenceDiagnostics {
  /** Fraction (0-1) of the 10 scoring dimensions that have at least one
   * "calculated" evidence item. Deterministic: dimensionsWithEvidence /
   * totalDimensions — never an arbitrary percentage. */
  coverage: number;
  /** Dimension labels with zero evidence (positive or negative) at all. */
  missingCriticalEvidence: string[];
  /** assumptionEvidenceCount / totalEvidenceCount. */
  assumptionRatio: number;
  /** Count of distinct EvidenceType values present. */
  sourceDiversity: number;
  /** Non-empty only when the platform's catalog entry was last reviewed
   * more than 180 days ago — a fixed, documented cutoff, not a guess. */
  freshnessWarnings: string[];
}

const FRESHNESS_WARNING_DAYS = 180;

export function computeEvidenceDiagnostics(
  evidence: EngineEvidence[],
  dimensions: DimensionResult[],
  platform: RankedPlatform["platform"],
  now: Date = new Date(),
): EvidenceDiagnostics {
  const dimensionsWithEvidence = new Set(
    evidence.filter((e) => e.type === "calculated" && e.relatedDimension !== null).map((e) => e.relatedDimension),
  );
  const coverage = dimensions.length === 0 ? 0 : dimensionsWithEvidence.size / dimensions.length;
  const missingCriticalEvidence = dimensions.filter((d) => !dimensionsWithEvidence.has(d.key)).map((d) => d.label);

  const assumptionCount = evidence.filter((e) => e.type === "assumption").length;
  const assumptionRatio = evidence.length === 0 ? 0 : assumptionCount / evidence.length;

  const sourceDiversity = new Set(evidence.map((e) => e.type)).size;

  const freshnessWarnings: string[] = [];
  const reviewed = new Date(platform.lastReviewedDate);
  const ageDays = (now.getTime() - reviewed.getTime()) / (1000 * 60 * 60 * 24);
  if (Number.isFinite(ageDays) && ageDays > FRESHNESS_WARNING_DAYS) {
    freshnessWarnings.push(
      `${platform.vendor} ${platform.productName}'s catalog entry was last reviewed ${platform.lastReviewedDate}, more than ${FRESHNESS_WARNING_DAYS} days ago.`,
    );
  }

  return { coverage, missingCriticalEvidence, assumptionRatio, sourceDiversity, freshnessWarnings };
}
