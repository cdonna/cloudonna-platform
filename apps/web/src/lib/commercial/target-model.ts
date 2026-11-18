/**
 * First CHF 1M bookings model (brief §12/§13) — a planning scenario,
 * not a forecast. Assumptions are a plain, editable array (counts ×
 * package price), never hardcoded into one fixed total — the default
 * scenario below is exactly the brief's own worked example, reproduced
 * so the arithmetic is independently checkable, not because the
 * number 1,025,000 is special.
 *
 * Bookings vs. ARR vs. TCV are modeled as genuinely different things
 * (brief §13), not interchangeable labels for the same number:
 *
 *  - Bookings: the committed contract value recognized at signing —
 *    the primary target this model tracks toward.
 *  - ARR: only the recurring portion (Team/Enterprise annual
 *    contracts) — a one-time Decision Sprint contributes zero ARR,
 *    by construction, since it has no renewal term.
 *  - TCV: total contract value across the full committed term — equal
 *    to bookings for a one-year deal, a multiple of ARR for a
 *    multi-year one. This model assumes 1-year terms throughout (the
 *    only term length any package definition states), so TCV == ARR
 *    for recurring packages and TCV == bookings for one-time ones;
 *    a real multi-year contract would need its own term length
 *    recorded on the opportunity, which this V1 does not yet do (see
 *    Known Limitations).
 */
import { DECISION_SPRINT, ENTERPRISE, TEAM, type CommercialPackageId } from "./packages";

export interface TargetAssumption {
  packageId: CommercialPackageId;
  count: number;
  /** Defaults to the package's own indicative starting price when
   * omitted — but a real planning scenario should usually override
   * this with the actual negotiated/expected value per deal, since
   * "starting from" is a floor, not an average. */
  valuePerDealChf?: number;
}

export interface TargetAssumptionResult {
  packageId: CommercialPackageId;
  count: number;
  valuePerDealChf: number;
  bookingsChf: number;
  isRecurring: boolean;
  arrChf: number;
}

export interface TargetModelResult {
  assumptions: TargetAssumptionResult[];
  totalBookingsChf: number;
  totalArrChf: number;
  totalTcvChf: number;
}

const RECURRING_PACKAGES: CommercialPackageId[] = ["team", "enterprise"];

function defaultValueFor(packageId: CommercialPackageId): number {
  if (packageId === "decision_sprint") return DECISION_SPRINT.startingAtChf ?? 0;
  if (packageId === "team") return TEAM.startingAtChf ?? 0;
  if (packageId === "enterprise") return ENTERPRISE.startingAtChf ?? 0;
  return 0;
}

export function computeTargetModel(assumptions: TargetAssumption[]): TargetModelResult {
  const resolved: TargetAssumptionResult[] = assumptions.map((a) => {
    const valuePerDealChf = a.valuePerDealChf ?? defaultValueFor(a.packageId);
    const bookingsChf = a.count * valuePerDealChf;
    const isRecurring = RECURRING_PACKAGES.includes(a.packageId);
    return { packageId: a.packageId, count: a.count, valuePerDealChf, bookingsChf, isRecurring, arrChf: isRecurring ? bookingsChf : 0 };
  });

  const totalBookingsChf = resolved.reduce((sum, r) => sum + r.bookingsChf, 0);
  const totalArrChf = resolved.reduce((sum, r) => sum + r.arrChf, 0);
  // TCV == bookings under the single-year-term assumption stated
  // above — see the module comment for exactly what this does not
  // yet model (multi-year committed terms).
  const totalTcvChf = totalBookingsChf;

  return { assumptions: resolved, totalBookingsChf, totalArrChf, totalTcvChf };
}

/** The brief's own worked example (§12): 10 Decision Sprints + 5 Team
 * contracts + 2 Enterprise contracts at CHF 200k each = CHF 1,025,000.
 * Note the Enterprise value (200k) is a planning assumption for this
 * scenario, not the package's public "starting from" figure (which is
 * null/"Talk to ClouDonna") — exactly why `valuePerDealChf` exists as
 * an explicit override. */
export const DEFAULT_FIRST_MILLION_SCENARIO: TargetAssumption[] = [
  { packageId: "decision_sprint", count: 10, valuePerDealChf: 25_000 },
  { packageId: "team", count: 5, valuePerDealChf: 75_000 },
  { packageId: "enterprise", count: 2, valuePerDealChf: 200_000 },
];

export const FIRST_MILLION_TARGET_CHF = 1_000_000;
