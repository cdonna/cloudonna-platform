"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { computeScenarioScores, DATA_PLATFORM_SCENARIO } from "./scenario";

export function ScenarioLab() {
  const { dict } = useLocale();
  const s = dict.scenarioLabPage;
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const scores = computeScenarioScores(DATA_PLATFORM_SCENARIO, activeIds);
  const ranked = [...DATA_PLATFORM_SCENARIO.platforms].sort((a, b) => scores[b.id] - scores[a.id]);
  const leaderId = ranked[0]?.id;

  function toggle(id: string) {
    setActiveIds((current) => (current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id]));
  }

  return (
    <div>
      <div className="rounded-2xl border border-titanium bg-carbon-2 p-5 text-sm leading-6 text-nova-ink-muted">
        {DATA_PLATFORM_SCENARIO.situation}
      </div>

      <div className="mt-8">
        <h3 className="text-xs font-semibold tracking-[0.16em] text-nova-ink-faint uppercase">{s.toggleHeading}</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {DATA_PLATFORM_SCENARIO.assumptions.map((assumption) => {
            const active = activeIds.includes(assumption.id);
            return (
              <button
                key={assumption.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(assumption.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition duration-control ${
                  active
                    ? "border-transparent bg-gradient-to-r from-nova-accent to-sunset-coral text-white"
                    : "border-titanium bg-carbon text-nova-ink-muted hover:border-titanium-strong hover:text-nova-ink"
                }`}
              >
                {assumption.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-titanium bg-carbon p-6">
          <h3 className="text-xs font-semibold tracking-[0.16em] text-nova-accent-strong uppercase">{s.recommendationHeading}</h3>
          <div className="mt-5 space-y-4">
            {ranked.map((platform) => (
              <div key={platform.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className={platform.id === leaderId ? "font-semibold text-nova-ink" : "text-nova-ink-muted"}>{platform.name}</span>
                  <span className="font-mono font-semibold tabular-nums text-nova-ink">{scores[platform.id]}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-carbon-2">
                  <div
                    className={`h-full rounded-full transition-[width] duration-300 ease-nova-settle ${
                      platform.id === leaderId ? "bg-gradient-to-r from-nova-accent to-sunset-coral" : "bg-nova-ink-faint"
                    }`}
                    style={{ width: `${scores[platform.id]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-titanium bg-carbon p-6">
          <h3 className="text-xs font-semibold tracking-[0.16em] text-nova-accent-strong uppercase">{s.shiftsHeading}</h3>
          {activeIds.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-nova-ink-faint">{s.noShiftsBody}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {activeIds.map((id) => {
                const assumption = DATA_PLATFORM_SCENARIO.assumptions.find((candidate) => candidate.id === id);
                if (!assumption) return null;
                return (
                  <p key={id} className="text-sm leading-6 text-nova-ink-muted">
                    {assumption.note}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ScenarioTimeline() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {DATA_PLATFORM_SCENARIO.timeline.map((event) => (
        <div key={event.id} className="rounded-2xl border border-titanium bg-carbon p-5">
          <span className="text-xs font-semibold tracking-[0.14em] text-nova-accent-strong uppercase">{event.when}</span>
          <h4 className="mt-2 font-semibold text-nova-ink">{event.title}</h4>
          <p className="mt-2 text-sm leading-6 text-nova-ink-muted">{event.body}</p>
        </div>
      ))}
    </div>
  );
}
