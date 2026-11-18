/** Account status (brief §4) — set explicitly by staff, never
 * auto-derived from opportunity stage or any other signal. */
export const ACCOUNT_STATUSES = ["prospect", "active_opportunity", "customer", "expansion", "inactive"] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  prospect: "Prospect",
  active_opportunity: "Active Opportunity",
  customer: "Customer",
  expansion: "Expansion",
  inactive: "Inactive",
};
