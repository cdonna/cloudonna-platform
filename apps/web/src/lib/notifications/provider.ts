/**
 * The seam every future notification (a new inquiry, a billing event)
 * must go through — no route or component may call an email SDK
 * directly. Same shape as BillingProvider and the
 * VisitorIntelligenceProvider recommended in
 * docs/growth/01-b2b-visitor-intelligence-evaluation.md. No concrete
 * adapter exists yet — see docs/operations/01-business-operations.md
 * for what has to happen before one is written (picking a provider,
 * e.g. Resend, and configuring an API key).
 */
export interface InquiryNotification {
  inquiryId: string;
  inquiryType: string;
  name: string;
  businessEmail: string;
  company: string | null;
}

export interface NotificationProvider {
  readonly providerId: string;
  isConfigured(): boolean;
  notifyNewInquiry(notification: InquiryNotification): Promise<void>;
}
