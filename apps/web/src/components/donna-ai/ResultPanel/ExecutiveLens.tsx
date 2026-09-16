"use client";

/**
 * "Use the same decision underneath. Change the perspective." — this
 * never recomputes anything. It only reorders and highlights three of
 * the ten dimensions scoring/engine.ts already computed, per persona.
 * No new evidence, no new score, no separate product.
 */
import { useState } from "react";
import { localizedDimensionLabel } from "@/i18n/dimension-labels";
import { useLocale } from "@/i18n/LocaleProvider";
import type { ScoreDimensionKey } from "../scoring/types";
import type { DecisionOutput } from "../types";

type ExecutivePersona = "cio" | "cfo" | "ceo" | "ai-leader" | "architect";

const PERSONAS: { id: ExecutivePersona; label: string; focus: ScoreDimensionKey[] }[] = [
  { id: "cio", label: "CIO", focus: ["architecture", "technology", "governance"] },
  { id: "cfo", label: "CFO", focus: ["cost", "timeToValue", "strategic"] },
  { id: "ceo", label: "CEO", focus: ["strategic", "business", "aiReadiness"] },
  { id: "ai-leader", label: "AI Leader", focus: ["aiReadiness", "governance", "technology"] },
  { id: "architect", label: "Architect", focus: ["architecture", "ecosystem", "technology"] },
];

export function ExecutiveLens({ output }: { output: DecisionOutput }) {
  const { dict, locale } = useLocale();
  const [activeId, setActiveId] = useState<ExecutivePersona>("cio");
  const active = PERSONAS.find((persona) => persona.id === activeId) ?? PERSONAS[0];
  const focusDimensions = active.focus
    .map((key) => output.dimensions.find((dimension) => dimension.key === key))
    .filter((dimension): dimension is NonNullable<typeof dimension> => Boolean(dimension));

  return (
    <div className="rounded-2xl border border-titanium bg-carbon-2 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold tracking-[0.1em] text-nova-ink-faint uppercase">{dict.resultOverview.readAsLabel}</span>
        <div role="tablist" aria-label={dict.resultOverview.readAsLabel} className="flex flex-wrap gap-1.5">
          {PERSONAS.map((persona) => {
            const isActive = persona.id === activeId;
            return (
              <button
                key={persona.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(persona.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition duration-control ${
                  isActive
                    ? "border-transparent bg-gradient-to-r from-nova-accent to-sunset-coral text-white"
                    : "border-titanium bg-carbon text-nova-ink-muted hover:text-nova-ink"
                }`}
              >
                {persona.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {focusDimensions.map((dimension) => (
          <div key={dimension.key} className="rounded-xl border border-titanium bg-carbon p-3.5">
            <div className="text-xs text-nova-ink-faint">{localizedDimensionLabel(dimension.key, dimension.label, locale)}</div>
            <div className="mt-1 font-mono text-lg font-semibold text-nova-ink">{dimension.score}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
