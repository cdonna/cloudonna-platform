/**
 * Pipeline CSV export (brief §42) — "optional simple CSV export... if
 * cheap and secure." A pure string-building function, no I/O; the
 * route handler (staff-gated) is the only place this is ever called.
 * Deliberately a handful of fields, not a full data dump — commercial
 * data that leaves this format is commercial data someone could paste
 * elsewhere, so this stays minimal by design.
 */
import type { CommercialOpportunitySummary } from "./repository";
import { COMMERCIAL_PACKAGES } from "./packages";
import { OPPORTUNITY_STAGE_LABELS } from "./opportunity-stages";

const HEADERS = ["Account", "Package", "Stage", "Expected bookings (CHF)", "Expected ARR (CHF)", "Expected TCV (CHF)", "Next action", "Next action due", "Target close date"];

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function buildOpportunitiesCsv(opportunities: CommercialOpportunitySummary[]): string {
  const rows = opportunities.map((o) =>
    [
      o.accountName,
      COMMERCIAL_PACKAGES[o.commercialPackage].name,
      OPPORTUNITY_STAGE_LABELS[o.stage],
      o.expectedBookingsChf?.toString() ?? "",
      o.expectedArrChf?.toString() ?? "",
      o.expectedTcvChf?.toString() ?? "",
      o.nextAction ?? "",
      o.nextActionDueAt ?? "",
      o.targetCloseDate ?? "",
    ]
      .map((v) => csvEscape(v))
      .join(","),
  );

  return [HEADERS.join(","), ...rows].join("\n");
}
