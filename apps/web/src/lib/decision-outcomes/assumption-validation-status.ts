/** Per-assumption validation status (brief §34) — becomes Decision
 * Memory once set. Tenant-private, same posture as decision_outcomes/
 * business_case_actuals — never read by lib/commercial/ or anything
 * under components/donna-ai/ scoring. */
export const ASSUMPTION_VALIDATION_STATUSES = ["confirmed", "invalidated", "partially_true", "unknown"] as const;

export type AssumptionValidationStatus = (typeof ASSUMPTION_VALIDATION_STATUSES)[number];

export const ASSUMPTION_VALIDATION_STATUS_LABELS: Record<AssumptionValidationStatus, string> = {
  confirmed: "Confirmed",
  invalidated: "Invalidated",
  partially_true: "Partially true",
  unknown: "Unknown",
};
