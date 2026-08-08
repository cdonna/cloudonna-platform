import "server-only";

import type { InquiryNotification, NotificationProvider } from "../provider";

/**
 * The only NotificationProvider registered today. Logs server-side
 * rather than silently no-oping, so a new inquiry is always at least
 * visible in server logs even before FOUNDER_CONTACT_EMAIL and a real
 * email provider are configured — persistence (the inquiries table)
 * already works regardless of this provider; this only affects whether
 * a human gets proactively pinged.
 */
export class ConsoleNotificationProvider implements NotificationProvider {
  readonly providerId = "console";

  isConfigured(): boolean {
    return false;
  }

  async notifyNewInquiry(notification: InquiryNotification): Promise<void> {
    console.log(
      `INQUIRY STORED — ${notification.inquiryType} inquiry ${notification.inquiryId} from ${notification.name} <${notification.businessEmail}>${notification.company ? ` (${notification.company})` : ""}.`,
    );
    console.warn(
      "FOUNDER EMAIL NOT CONFIGURED — set RESEND_API_KEY and FOUNDER_CONTACT_EMAIL to enable real notifications. See docs/operations/01-business-operations.md.",
    );
  }
}
