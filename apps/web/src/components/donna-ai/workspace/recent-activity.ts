/**
 * Recent Donna Activity (brief §81) — composed purely from already-
 * persisted, real state: each saved version's own change_reason
 * (decision_versions, the existing audit trail) and vendor-knowledge
 * decision_impacts. No research-session history feed yet (see the
 * capability doc's Known Limitations) — a genuine, honest subset
 * rather than a fabricated richer feed.
 */
import type { DecisionImpact } from "../vendor-intelligence/evidence-graph/types";

export interface ActivityItem {
  label: string;
  timestamp: string;
  kind: "version" | "impact";
}

export interface ActivityVersionInput {
  versionNumber: number;
  changeReason: string | null;
  createdAt: string;
}

export function computeRecentActivity(versions: ActivityVersionInput[], impacts: DecisionImpact[], limit = 8): ActivityItem[] {
  const versionItems: ActivityItem[] = versions.map((v) => ({
    label: v.changeReason ? `v${v.versionNumber}: ${v.changeReason}` : `v${v.versionNumber} saved`,
    timestamp: v.createdAt,
    kind: "version",
  }));

  const impactItems: ActivityItem[] = impacts.map((i) => ({
    label: `Vendor knowledge change affecting ${i.affectedOption}: ${i.recommendationImpact}`,
    timestamp: i.createdAt,
    kind: "impact",
  }));

  return [...versionItems, ...impactItems].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
}
