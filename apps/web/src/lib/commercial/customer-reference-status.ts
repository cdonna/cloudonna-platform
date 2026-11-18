/** Customer reference permission status (brief §46/§47). Default
 * posture everywhere this is read: PRIVATE, no public use of any
 * kind, until a staff member records explicit customer consent. */
export const CUSTOMER_REFERENCE_STATUSES = ["private", "anonymous_allowed", "logo_allowed", "case_study_allowed"] as const;

export type CustomerReferenceStatus = (typeof CUSTOMER_REFERENCE_STATUSES)[number];

export const CUSTOMER_REFERENCE_STATUS_LABELS: Record<CustomerReferenceStatus, string> = {
  private: "Private — no public use",
  anonymous_allowed: "Anonymous statistics allowed",
  logo_allowed: "Logo use allowed",
  case_study_allowed: "Case study allowed",
};
