import "server-only";

import type { InquiryNotification, NotificationProvider } from "../provider";

/**
 * A real implementation, not a stub — but it only ever runs when both
 * RESEND_API_KEY and FOUNDER_CONTACT_EMAIL are set (see config.ts),
 * which is not the case anywhere this codebase has been run so far.
 * Uses plain fetch() against Resend's REST API rather than the
 * `resend` npm package: one endpoint, one JSON body, and avoiding the
 * dependency means there is nothing new to audit or version-bump for a
 * single POST request. Chosen over Postmark/SendGrid for the same
 * reason docs/operations/01-business-operations.md gave: simplest
 * Vercel-native option, no infrastructure of its own to run.
 */
export class ResendNotificationProvider implements NotificationProvider {
  readonly providerId = "resend";

  constructor(
    private readonly apiKey: string,
    private readonly founderEmail: string,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.founderEmail);
  }

  async notifyNewInquiry(notification: InquiryNotification): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ClouDonna <notifications@cdonna.com>",
        to: [this.founderEmail],
        subject: `New ${notification.inquiryType} inquiry — ${notification.name}`,
        text: [
          `Type: ${notification.inquiryType}`,
          `Name: ${notification.name}`,
          `Email: ${notification.businessEmail}`,
          notification.company ? `Company: ${notification.company}` : null,
          "",
          `View it: /app/inquiries`,
        ]
          .filter((line): line is string => line !== null)
          .join("\n"),
      }),
    });

    if (!response.ok) {
      // Thrown, not swallowed here — handleCreateInquiryRequest is the
      // layer responsible for deciding that a notification failure
      // must never fail the request; this class's own job is just to
      // report accurately whether the send worked.
      throw new Error(`Resend responded with ${response.status}`);
    }
  }
}
