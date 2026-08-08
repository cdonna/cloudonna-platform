import "server-only";

import type { NotificationProvider } from "./provider";
import { ConsoleNotificationProvider } from "./providers/console";
import { ResendNotificationProvider } from "./providers/resend";

/** Read once, at the call site that needs it — never baked into a
 * client bundle. No default: an unset FOUNDER_CONTACT_EMAIL means "no
 * one has told us who to notify yet," not "notify no one" silently
 * forever without anyone knowing why. */
export function getFounderContactEmail(): string | null {
  return process.env.FOUNDER_CONTACT_EMAIL ?? null;
}

/** Returns ResendNotificationProvider only when BOTH RESEND_API_KEY and
 * FOUNDER_CONTACT_EMAIL are set — otherwise ConsoleNotificationProvider,
 * which logs a clear "FOUNDER EMAIL NOT CONFIGURED" warning instead of
 * pretending to send anything. Neither env var is set anywhere this
 * codebase has been run, so this still resolves to the console
 * provider today — the switch exists so setting two env vars in
 * production is the entire activation step, no code change required. */
export function getNotificationProvider(): NotificationProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const founderEmail = getFounderContactEmail();

  if (apiKey && founderEmail) {
    return new ResendNotificationProvider(apiKey, founderEmail);
  }

  return new ConsoleNotificationProvider();
}
