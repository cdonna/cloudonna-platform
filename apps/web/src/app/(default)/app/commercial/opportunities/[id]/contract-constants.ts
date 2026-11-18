/** UI-only label maps for commercial_contracts enum columns — mirrors
 * contract-economics.ts's CommercialContractStatus/CommercialBillingFrequency
 * types exactly; kept here rather than in that module since it is a
 * pure calculation file with no UI concerns. */
export const CONTRACT_STATUSES = ["draft", "proposed", "signed", "active", "expired", "cancelled"] as const;

export const CONTRACT_STATUS_LABELS: Record<(typeof CONTRACT_STATUSES)[number], string> = {
  draft: "Draft",
  proposed: "Proposed",
  signed: "Signed",
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const BILLING_FREQUENCIES = ["one_time", "monthly", "annual"] as const;

export const BILLING_FREQUENCY_LABELS: Record<(typeof BILLING_FREQUENCIES)[number], string> = {
  one_time: "One-time",
  monthly: "Monthly",
  annual: "Annual",
};
