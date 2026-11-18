import { describe, expect, it } from "vitest";
import { computeContractEconomics, type ContractEconomicsInput } from "../contract-economics";

const BASE: ContractEconomicsInput = {
  oneTimeFee: 0,
  servicesFee: 0,
  recurringAnnualFee: 0,
  discountPercent: 0,
  currency: "CHF",
  contractStatus: "signed",
  termMonths: null,
  contractStart: null,
  contractEnd: null,
};

describe("computeContractEconomics", () => {
  it("matches the brief's own worked example: CHF 75k ARR x 3 years + CHF 25k one-time = CHF 250k TCV", () => {
    const result = computeContractEconomics({ ...BASE, oneTimeFee: 25_000, recurringAnnualFee: 75_000, termMonths: 36 });
    expect(result.arrChf).toBe(75_000);
    expect(result.tcvChf).toBe(250_000);
    expect(result.bookingsChf).toBe(100_000); // one-time 25k + first-year ARR 75k, not the full 3-year TCV
  });

  it("a one-time Decision Sprint contributes zero ARR", () => {
    const result = computeContractEconomics({ ...BASE, oneTimeFee: 25_000, termMonths: 1 });
    expect(result.arrChf).toBe(0);
    expect(result.bookingsChf).toBe(25_000);
    expect(result.tcvChf).toBe(25_000);
  });

  it("applies a discount once across every fee component, never double-counted", () => {
    const result = computeContractEconomics({ ...BASE, oneTimeFee: 10_000, recurringAnnualFee: 100_000, termMonths: 12, discountPercent: 10 });
    expect(result.arrChf).toBe(90_000);
    expect(result.bookingsChf).toBe(10_000 * 0.9 + 100_000 * 0.9);
    expect(result.tcvChf).toBe(10_000 * 0.9 + 100_000 * 0.9);
  });

  it("recognizes bookings only for SIGNED or ACTIVE contracts", () => {
    expect(computeContractEconomics({ ...BASE, contractStatus: "draft" }).isRecognizedBooking).toBe(false);
    expect(computeContractEconomics({ ...BASE, contractStatus: "proposed" }).isRecognizedBooking).toBe(false);
    expect(computeContractEconomics({ ...BASE, contractStatus: "signed" }).isRecognizedBooking).toBe(true);
    expect(computeContractEconomics({ ...BASE, contractStatus: "active" }).isRecognizedBooking).toBe(true);
    expect(computeContractEconomics({ ...BASE, contractStatus: "expired" }).isRecognizedBooking).toBe(false);
    expect(computeContractEconomics({ ...BASE, contractStatus: "cancelled" }).isRecognizedBooking).toBe(false);
  });

  it("derives term years from contract_start/contract_end when term_months is absent", () => {
    const result = computeContractEconomics({ ...BASE, recurringAnnualFee: 100_000, contractStart: "2026-01-01", contractEnd: "2028-01-01" });
    expect(result.termYears).toBeCloseTo(2, 1);
    expect(Math.abs((result.tcvChf ?? 0) - 200_000)).toBeLessThan(500); // 365.25-day-year approximation, not calendar-exact
  });

  it("never fabricates a CHF-equivalent for a non-CHF contract without an approved planning value", () => {
    const result = computeContractEconomics({ ...BASE, currency: "EUR", recurringAnnualFee: 50_000, termMonths: 12 });
    expect(result.bookingsChf).toBeNull();
    expect(result.arrChf).toBeNull();
    expect(result.tcvChf).toBeNull();
    expect(result.arrOriginal).toBe(50_000);
  });

  it("uses an approved planning value, proportionally split, for a non-CHF contract", () => {
    const result = computeContractEconomics({ ...BASE, currency: "EUR", oneTimeFee: 10_000, recurringAnnualFee: 40_000, termMonths: 12 }, 55_000);
    expect(result.tcvChf).toBeCloseTo(55_000, 6);
    expect(result.bookingsChf).toBeCloseTo(55_000, 6); // 1-year term: bookings == TCV in original currency too
  });
});
