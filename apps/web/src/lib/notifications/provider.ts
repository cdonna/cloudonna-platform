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
  // null, not a fabricated value — createInquiry() can no longer read
  // the inserted row's id back (RLS blocks INSERT ... RETURNING for a
  // non-staff inserter; see repository.ts's createInquiry() comment).
  // A provider that wants a deep link to the row should look it up by
  // businessEmail/name/createdAt in /app/inquiries instead of relying
  // on an id this layer genuinely doesn't have.
  inquiryId: string | null;
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
