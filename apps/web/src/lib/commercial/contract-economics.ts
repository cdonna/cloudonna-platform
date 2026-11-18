/**
 * Deterministic contract economics (brief §8/§9/§10/§11) — the single
 * place Bookings, ARR, and TCV are computed from a real
 * commercial_contracts row. All three are kept genuinely distinct,
 * never interchangeable labels for the same number:
 *
 *  - ARR: the recurring_annual_fee only, net of discount. A one-time
 *    Decision Sprint contract (recurringAnnualFee = 0) always
 *    contributes exactly zero ARR, by construction.
 *
 *  - Bookings: the contracted value attributable to the PERIOD of
 *    signing — one_time_fee + services_fee + one year of
 *    recurring_annual_fee, net of discount. This is deliberately NOT
 *    the full multi-year TCV (brief §11's "do not conflate these") —
 *    a 3-year, CHF 75k/year Team contract books CHF 75k at signing,
 *    not CHF 225k; the other two years are committed TCV, not yet
 *    "attributable to the period."
 *
 *  - TCV: the full committed contract value across termYears,
 *    net of discount — one_time_fee + services_fee +
 *    recurring_annual_fee * termYears. Matches the brief's own worked
 *    example: CHF 75k ARR x 3 years = CHF 225k recurring TCV, plus a
 *    CHF 25k one-time fee = CHF 250k total TCV.
 *
 * Discount is applied once, as a uniform percentage reduction across
 * every fee component — never applied twice to the same dollar (the
 * brief's explicit "do not double-count overlapping fees").
 *
 * Bookings/ARR/TCV are only ever computed in the contract's own
 * `currency`. A non-CHF contract's *_chf fields come back null unless
 * the parent opportunity has an explicit, staff-approved
 * `planningValueChf` override (brief §55) — never a fabricated FX
 * conversion.
 */

export type CommercialCurrency = "CHF" | "EUR" | "USD" | "GBP";
export type CommercialContractStatus = "draft" | "proposed" | "signed" | "active" | "expired" | "cancelled";
export type CommercialBillingFrequency = "one_time" | "monthly" | "annual";

export interface ContractEconomicsInput {
  oneTimeFee: number;
  servicesFee: number;
  recurringAnnualFee: number;
  discountPercent: number;
  currency: CommercialCurrency;
  contractStatus: CommercialContractStatus;
  termMonths: number | null;
  contractStart: string | null;
  contractEnd: string | null;
}

export interface ContractEconomicsResult {
  /** Resolved contract term in years — see resolveTermYears() for how
   * it is derived when termMonths is not explicitly set. */
  termYears: number;
  /** True for 'signed' and 'active' only (brief §11: "bookings become
   * recognized only when commercial status is SIGNED or equivalent" —
   * ACTIVE is the equivalent state once delivery has started, having
   * necessarily passed through signing). DRAFT/PROPOSED/EXPIRED/
   * CANCELLED never count as bookings. */
  isRecognizedBooking: boolean;
  /** Economics in the contract's own currency — always computed,
   * regardless of currency. */
  bookingsOriginal: number;
  arrOriginal: number;
  tcvOriginal: number;
  /** CHF-equivalent economics. Equal to the "Original" fields when
   * currency === "CHF". Null when currency !== "CHF" and no
   * planningValueChf override is supplied — never invented. */
  bookingsChf: number | null;
  arrChf: number | null;
  tcvChf: number | null;
}

const RECOGNIZED_BOOKING_STATUSES: CommercialContractStatus[] = ["signed", "active"];

/** Falls back, in order, to: explicit termMonths -> contractStart/
 * contractEnd date span -> a documented 1-year default (never a
 * silent zero, since a recurring fee with a zero-year term would
 * wrongly imply no commitment at all). */
function resolveTermYears(input: ContractEconomicsInput): number {
  if (input.termMonths !== null && input.termMonths > 0) return input.termMonths / 12;
  if (input.contractStart && input.contractEnd) {
    const start = new Date(input.contractStart).getTime();
    const end = new Date(input.contractEnd).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return (end - start) / (365.25 * 24 * 60 * 60 * 1000);
    }
  }
  return 1;
}

/** `planningValueChf`, when supplied, is a staff-approved CHF
 * equivalent for the WHOLE contract's TCV (brief §55) — ARR/Bookings
 * CHF-equivalents are then derived from it proportionally to the
 * original-currency split, rather than requiring three separate
 * manual approvals for one contract. */
export function computeContractEconomics(input: ContractEconomicsInput, planningValueChf: number | null = null): ContractEconomicsResult {
  const termYears = resolveTermYears(input);
  const netMultiplier = 1 - Math.min(Math.max(input.discountPercent, 0), 100) / 100;

  const netOneTimeAndServices = (input.oneTimeFee + input.servicesFee) * netMultiplier;
  const netRecurringAnnual = input.recurringAnnualFee * netMultiplier;

  const bookingsOriginal = netOneTimeAndServices + netRecurringAnnual;
  const arrOriginal = netRecurringAnnual;
  const tcvOriginal = netOneTimeAndServices + netRecurringAnnual * termYears;

  const isRecognizedBooking = RECOGNIZED_BOOKING_STATUSES.includes(input.contractStatus);

  if (input.currency === "CHF") {
    return { termYears, isRecognizedBooking, bookingsOriginal, arrOriginal, tcvOriginal, bookingsChf: bookingsOriginal, arrChf: arrOriginal, tcvChf: tcvOriginal };
  }

  if (planningValueChf === null || tcvOriginal === 0) {
    return { termYears, isRecognizedBooking, bookingsOriginal, arrOriginal, tcvOriginal, bookingsChf: null, arrChf: null, tcvChf: null };
  }

  // Proportional split of the single approved CHF figure, using the
  // original-currency ratios — never an independent FX rate per field.
  const scale = planningValueChf / tcvOriginal;
  return {
    termYears,
    isRecognizedBooking,
    bookingsOriginal,
    arrOriginal,
    tcvOriginal,
    bookingsChf: bookingsOriginal * scale,
    arrChf: arrOriginal * scale,
    tcvChf: planningValueChf,
  };
}
