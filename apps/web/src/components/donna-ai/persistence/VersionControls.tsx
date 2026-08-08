"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DecisionVersionSummary } from "./decisions-repository";

/**
 * Sprint 6.2 — the explicit "Version selector / View button / Diff
 * button" trio the Decision Detail page requires, distinct from (but
 * consistent with) DecisionTimeline's own per-row View/Diff links. Named
 * "View," never "Replay" — nothing here re-executes the deterministic
 * engine, it only navigates to a stored historical version exactly as
 * saved. See docs/capabilities/decision-memory.md, "Slice A." Real
 * Decision Replay is a separate, not-yet-built capability. Client-only
 * because it needs local selection state before navigating — everything
 * it navigates *to* is still a plain server-rendered page (no
 * client-side data fetching happens here).
 */
export function VersionControls({
  decisionId,
  versions,
  displayedVersionNumber,
}: {
  decisionId: string;
  versions: DecisionVersionSummary[];
  displayedVersionNumber: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(displayedVersionNumber);

  function handleView() {
    router.push(`/app/decisions/${decisionId}?version=${selected}`);
  }

  function handleDiff() {
    router.push(`/app/decisions/${decisionId}?version=${displayedVersionNumber}&compare=${selected}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-titanium bg-carbon p-4">
      <label htmlFor="version-select" className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">
        Version
      </label>
      <select
        id="version-select"
        value={selected}
        onChange={(event) => setSelected(Number(event.target.value))}
        className="h-9 rounded-lg border border-titanium bg-carbon-2 px-2.5 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
      >
        {versions.map((version) => (
          <option key={version.id} value={version.versionNumber}>
            v{version.versionNumber} — {new Date(version.createdAt).toLocaleDateString()}
          </option>
        ))}
      </select>

      <Button
        type="button"
        variant="outline"
        onClick={handleView}
        disabled={selected === displayedVersionNumber}
        className="border-titanium bg-carbon-2 text-nova-ink hover:border-titanium-strong"
      >
        <History size={15} />
        View
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={handleDiff}
        disabled={selected === displayedVersionNumber}
        className="border-titanium bg-carbon-2 text-nova-ink hover:border-titanium-strong"
      >
        <GitCompare size={15} />
        Diff vs. viewed version
      </Button>
    </div>
  );
}
