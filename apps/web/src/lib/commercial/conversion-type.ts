/** Recorded conversion outcome types (brief §17/§18) — written by
 * staff once a real outcome is known, never auto-generated. */
export const CONVERSION_TYPES = ["sprint_to_team", "team_to_enterprise", "sprint_to_enterprise", "no_expansion", "follow_up_sprint"] as const;

export type ConversionType = (typeof CONVERSION_TYPES)[number];

export const CONVERSION_TYPE_LABELS: Record<ConversionType, string> = {
  sprint_to_team: "Sprint → Team",
  team_to_enterprise: "Team → Enterprise",
  sprint_to_enterprise: "Sprint → Enterprise",
  no_expansion: "No expansion",
  follow_up_sprint: "Follow-up sprint",
};
