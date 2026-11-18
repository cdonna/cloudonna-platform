/** Lost/won deal reason taxonomies (brief §27/§28) — optional,
 * never forced attribution. Free-text notes may accompany either. */
export const LOST_REASONS = [
  "no_budget",
  "no_priority",
  "timing",
  "competitor",
  "internal_decision",
  "procurement",
  "no_executive_sponsor",
  "product_gap",
  "security",
  "price",
  "no_response",
  "other",
] as const;

export type LostReason = (typeof LOST_REASONS)[number];

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  no_budget: "No budget",
  no_priority: "No priority",
  timing: "Timing",
  competitor: "Competitor",
  internal_decision: "Internal decision",
  procurement: "Procurement",
  no_executive_sponsor: "No executive sponsor",
  product_gap: "Product gap",
  security: "Security",
  price: "Price",
  no_response: "No response",
  other: "Other",
};

export const WON_REASONS = [
  "decision_urgency",
  "executive_alignment",
  "vendor_neutrality",
  "business_case",
  "evidence_quality",
  "speed",
  "governance",
  "other",
] as const;

export type WonReason = (typeof WON_REASONS)[number];

export const WON_REASON_LABELS: Record<WonReason, string> = {
  decision_urgency: "Decision urgency",
  executive_alignment: "Executive alignment",
  vendor_neutrality: "Vendor neutrality",
  business_case: "Business case",
  evidence_quality: "Evidence quality",
  speed: "Speed",
  governance: "Governance",
  other: "Other",
};
