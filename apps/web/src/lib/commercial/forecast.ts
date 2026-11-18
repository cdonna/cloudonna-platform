/** Forecast category (brief §25) — a human sales judgment call,
 * deliberately independent of probability_percent/stage defaults.
 * Nothing in this codebase derives one from the other. */
export const FORECAST_CATEGORIES = ["pipeline", "upside", "commit"] as const;

export type ForecastCategory = (typeof FORECAST_CATEGORIES)[number];

export const FORECAST_CATEGORY_LABELS: Record<ForecastCategory, string> = {
  pipeline: "Pipeline",
  upside: "Upside",
  commit: "Commit",
};
