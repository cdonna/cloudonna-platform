import "server-only";

import type { NotificationProvider } from "./provider";
import { ConsoleNotificationProvider } from "./providers/console";

/** Read once, at the call site that needs it — never baked into a
 * client bundle. No default: an unset FOUNDER_CONTACT_EMAIL means "no
 * one has told us who to notify yet," not "notify no one" silently
 * forever without anyone knowing why. */
export function getFounderContactEmail(): string | null {
  return process.env.FOUNDER_CONTACT_EMAIL ?? null;
}

/** Returns the console (log-only) provider unconditionally today — no
 * concrete email-sending adapter is registered yet
 * (docs/operations/01-business-operations.md, "Notification email").
 * Once one exists, this is the one function that gains a real switch;
 * nothing that calls getNotificationProvider() needs to change. */
export function getNotificationProvider(): NotificationProvider {
  return new ConsoleNotificationProvider();
}
