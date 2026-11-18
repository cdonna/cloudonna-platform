/** Cash-collection payment status (brief §12). */
export const PAYMENT_STATUSES = ["not_invoiced", "invoiced", "partially_paid", "paid", "overdue"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  not_invoiced: "Not invoiced",
  invoiced: "Invoiced",
  partially_paid: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
};
