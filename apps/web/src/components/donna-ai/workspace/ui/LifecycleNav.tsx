"use client";

/**
 * Lifecycle navigation (brief §4) — persistent, state-aware, no page
 * reload (plain client state, not a route change — every stage's
 * content is already loaded with the page). Mobile-usable: wraps to
 * a horizontally scrollable row rather than forcing eight items into
 * a width that doesn't fit (brief §64).
 */
import { Check } from "lucide-react";
import { LIFECYCLE_STAGES, LIFECYCLE_STAGE_LABELS, type LifecycleStage } from "../lifecycle-stage";

export function LifecycleNav({
  activeStage,
  onChange,
  completion,
}: {
  activeStage: LifecycleStage;
  onChange: (stage: LifecycleStage) => void;
  completion: Record<LifecycleStage, boolean>;
}) {
  return (
    <div role="tablist" aria-label="Decision lifecycle" className="flex gap-2 overflow-x-auto pb-1">
      {LIFECYCLE_STAGES.map((stage) => {
        const isActive = stage === activeStage;
        const isComplete = completion[stage];
        return (
          <button
            key={stage}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(stage)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              isActive ? "border-nova-accent bg-nova-accent text-white" : "border-titanium bg-carbon text-nova-ink-muted hover:text-nova-ink"
            }`}
          >
            {isComplete && !isActive && <Check size={13} className="text-nova-success" />}
            {LIFECYCLE_STAGE_LABELS[stage]}
          </button>
        );
      })}
    </div>
  );
}
