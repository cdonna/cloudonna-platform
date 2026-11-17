/**
 * Executive Recommendation (brief §19) — Strategic, Economic and
 * Architecture recommendations computed independently, then an
 * explicit OVERALL verdict that names disagreement rather than
 * hiding it. Every one of the three lenses reuses an engine that
 * already exists; this module adds no new scoring logic of its own,
 * only a documented way of reading the same numbers three different
 * ways:
 *
 *  - STRATEGIC — the Decision Engine's own base recommendation, using
 *    the organization's actual stated weights exactly as scored
 *    everywhere else in the product. Not re-derived here.
 *  - ARCHITECTURE — the same ranking, re-weighted toward the four
 *    architecture-adjacent criteria (architecture, technology,
 *    security, governance) via engine/scenario.ts's existing
 *    weight-override machinery. The specific override (each raised to
 *    20%, ~80% combined, the remaining six renormalized to share the
 *    rest) is a fixed, documented reading of "architecture lens," not
 *    a tunable per-request parameter.
 *  - ECONOMIC — whichever option has the best NPV in the Business
 *    Case Engine's output, when business case data exists. Null,
 *    never guessed, when it doesn't (brief §18: financial outputs
 *    stay separately inspectable, never fabricated to fill a lens
 *    that has no data).
 */
import { runScenario } from "./scenario";
import type { RankedPlatform } from "../scoring/types";
import type { BusinessCaseOutput } from "./business-case/types";

export interface LensWinner {
  optionId: string;
  optionName: string;
}

export interface ExecutiveRecommendation {
  strategic: LensWinner;
  architecture: LensWinner;
  /** Null exactly when no business case data was available to derive
   * an economic winner from. */
  economic: LensWinner | null;
  overall: LensWinner;
  /** True only when every available lens (strategic + architecture,
   * plus economic when present) names the same option. */
  agree: boolean;
  disagreementNote: string | null;
}

/** Fixed, documented architecture-lens weights — not a parameter.
 * Combined 80% across the four architecture-adjacent dimensions; the
 * remaining six dimensions renormalize to share the other 20% in
 * their existing relative proportions (engine/scenario.ts's own
 * renormalizeWeights rule). */
const ARCHITECTURE_LENS_OVERRIDES = { architecture: 0.25, technology: 0.2, security: 0.2, governance: 0.15 } as const;

function toLensWinner(platform: RankedPlatform): LensWinner {
  return { optionId: platform.platform.id, optionName: `${platform.platform.vendor} ${platform.platform.productName}` };
}

export function computeExecutiveRecommendation(ranked: RankedPlatform[], businessCase: BusinessCaseOutput | null = null): ExecutiveRecommendation {
  const strategic = toLensWinner(ranked[0]);

  const architectureScenario = runScenario(ranked, ARCHITECTURE_LENS_OVERRIDES);
  const architectureWinner = ranked.find((r) => r.platform.id === architectureScenario.scenarioWinnerId) ?? ranked[0];
  const architecture = toLensWinner(architectureWinner);

  let economic: LensWinner | null = null;
  if (businessCase && businessCase.options.length > 0) {
    const bestEconomic = [...businessCase.options].sort((a, b) => b.summary.npv - a.summary.npv)[0];
    const platform = ranked.find((r) => r.platform.id === bestEconomic.optionId);
    if (platform) economic = toLensWinner(platform);
  }

  const lenses = [strategic, architecture, ...(economic ? [economic] : [])];
  const agree = lenses.every((l) => l.optionId === lenses[0].optionId);

  // OVERALL is always the strategic lens's own winner — the Decision
  // Engine's base, holistic recommendation, using the organization's
  // actual stated weights. This is a deliberate choice, not a
  // tiebreak: when the lenses disagree, OVERALL does not silently
  // average or vote between them — disagreementNote says so plainly,
  // and a reader is expected to look at all three, not just OVERALL.
  const overall = strategic;

  const disagreementNote = agree
    ? null
    : `Architecture winner: ${architecture.optionName}. ${economic ? `Economic winner: ${economic.optionName}. ` : ""}Strategic winner: ${strategic.optionName}. These lenses disagree — see each one before treating the recommendation as settled.`;

  return { strategic, architecture, economic, overall, agree, disagreementNote };
}
