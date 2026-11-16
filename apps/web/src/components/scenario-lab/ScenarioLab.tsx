"use client";

import { useState } from "react";
import { FrameField, FramePanel, ProductFrame } from "@/components/editorial/primitives";
import { useLocale } from "@/i18n/LocaleProvider";
import { computeScenarioScores, DATA_PLATFORM_SCENARIO, type ShiftKind } from "./scenario";

const SHIFT_ORDER: ShiftKind[] = ["recommendation", "risk", "cost", "architecture"];

/**
 * The point of this component is that changing an assumption visibly
 * changes the answer. Before, it showed only the *new* score, so the
 * shift was invisible unless you remembered the old number — the one
 * thing the page exists to demonstrate was the one thing it didn't show.
 *
 * Now each platform carries its baseline, its current score, and the
 * signed delta between them; the leader is called out by name when it
 * changes hands; and the "what shifted" panel names which kind of thing
 * moved (recommendation, risk, cost, architecture) rather than only
 * restating the assumption in prose.
 *
 * Still pure and deterministic — computeScenarioScores is unchanged —
 * and still explicitly illustrative: 0–100 fit scores, no currency, no
 * forecast.
 */
export function ScenarioLab() {
  const { dict } = useLocale();
  const s = dict.scenarioLabPage;
  const [activeIds, setActiveIds] = useState<string[]>([]);

  const baseline = computeScenarioScores(DATA_PLATFORM_SCENARIO, []);
  const scores = computeScenarioScores(DATA_PLATFORM_SCENARIO, activeIds);
  const ranked = [...DATA_PLATFORM_SCENARIO.platforms].sort((a, b) => scores[b.id] - scores[a.id]);
  const baselineLeaderId = [...DATA_PLATFORM_SCENARIO.platforms].sort((a, b) => baseline[b.id] - baseline[a.id])[0]?.id;
  const leaderId = ranked[0]?.id;
  const leaderChanged = Boolean(activeIds.length) && leaderId !== baselineLeaderId;

  const activeAssumptions = activeIds
    .map((id) => DATA_PLATFORM_SCENARIO.assumptions.find((candidate) => candidate.id === id))
    .filter((assumption): assumption is NonNullable<typeof assumption> => Boolean(assumption));

  function toggle(id: string) {
    setActiveIds((current) => (current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id]));
  }

  return (
    <ProductFrame label={`${s.badge} · ${DATA_PLATFORM_SCENARIO.title}`} meta={dict.showcase.illustrativeLabel}>
      <div className="border-b border-rule p-6 sm:p-8">
        <p className="max-w-[70ch] text-[0.9375rem] leading-7 text-ink-2">{DATA_PLATFORM_SCENARIO.situation}</p>

        <div className="mt-7">
          <div className="font-mono text-label font-medium text-ink-3 uppercase">{s.toggleHeading}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {DATA_PLATFORM_SCENARIO.assumptions.map((assumption) => {
              const active = activeIds.includes(assumption.id);
              return (
                <button
                  key={assumption.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(assumption.id)}
                  className={`min-h-11 rounded-full border px-4 text-sm transition-colors duration-control focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none ${
                    active
                      ? "border-transparent bg-solid font-medium text-solid-on"
                      : "border-rule bg-paper-2 text-ink-2 hover:border-rule-2 hover:text-ink"
                  }`}
                >
                  {assumption.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-rule lg:grid-cols-[1.15fr_1fr]">
        <div className="bg-paper p-6 sm:p-8">
          <FrameField label={s.recommendationHeading}>
            <div className="mt-1 space-y-5">
              {ranked.map((platform) => {
                const score = scores[platform.id];
                const delta = score - baseline[platform.id];
                const isLeader = platform.id === leaderId;
                return (
                  <div key={platform.id}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className={isLeader ? "font-medium text-ink" : "text-ink-2"}>{platform.name}</span>
                      <span className="flex shrink-0 items-baseline gap-2 font-mono text-sm tabular-nums">
                        <span className="text-ink">{score}</span>
                        {/* The delta is the whole point, so it is always
                            rendered when non-zero — never only implied by
                            a bar that moved while you weren't looking. */}
                        {delta !== 0 && (
                          <span className={delta > 0 ? "text-sig-positive" : "text-sig-critical"}>
                            {delta > 0 ? "+" : "−"}
                            {Math.abs(delta)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-paper-3">
                      <div
                        className={`h-full rounded-full transition-[width] duration-panel ease-nova-settle ${isLeader ? "bg-accent" : "bg-ink-3"}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </FrameField>

          {leaderChanged && (
            <FramePanel tone="accent" className="mt-7">
              <div className="font-mono text-label font-medium text-accent uppercase">{s.shiftKinds.recommendation}</div>
              <p className="mt-2 text-sm leading-6 text-ink">{ranked[0]?.name}</p>
            </FramePanel>
          )}
        </div>

        <div className="bg-paper p-6 sm:p-8">
          <FrameField label={s.shiftsHeading}>
            {activeAssumptions.length === 0 ? (
              <p className="text-ink-3">{s.noShiftsBody}</p>
            ) : (
              <div className="space-y-7">
                {activeAssumptions.map((assumption) => (
                  <div key={assumption.id} className="border-t border-rule pt-4">
                    <div className="font-mono text-label font-medium text-ink-3 uppercase">{s.shiftKinds.input}</div>
                    <p className="mt-1.5 font-medium text-ink">{assumption.label}</p>
                    <p className="mt-2 text-sm leading-6 text-ink-2">{assumption.note}</p>

                    <dl className="mt-4 space-y-3">
                      {SHIFT_ORDER.filter((kind) => assumption.shifts[kind]).map((kind) => (
                        <div key={kind}>
                          <dt className="font-mono text-label font-medium text-accent uppercase">{s.shiftKinds[kind]}</dt>
                          <dd className="mt-1 text-sm leading-6 text-ink-2">{assumption.shifts[kind]}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </FrameField>
        </div>
      </div>

      <div className="border-t border-rule bg-paper-3 px-6 py-5 sm:px-8">
        <p className="text-sm leading-6 text-ink-3">{s.certaintyNote}</p>
      </div>
    </ProductFrame>
  );
}

/**
 * The same decision, months later. A single continuous rule rather than
 * four equal cards, because this is a sequence: the fourth event only
 * means something in the light of the first three.
 */
export function ScenarioTimeline() {
  return (
    <ol className="border-l border-rule">
      {DATA_PLATFORM_SCENARIO.timeline.map((event, index) => {
        const isLast = index === DATA_PLATFORM_SCENARIO.timeline.length - 1;
        return (
          <li key={event.id} className="relative pb-10 pl-8 last:pb-0">
            <span
              aria-hidden="true"
              className={`absolute -left-[0.3125rem] top-1.5 h-2.5 w-2.5 rounded-full ${isLast ? "bg-accent" : "bg-ink-3"}`}
            />
            <div className="font-mono text-label font-medium text-ink-3 uppercase">{event.when}</div>
            <h3 className={`mt-2 text-[1.0625rem] font-medium tracking-[-0.018em] ${isLast ? "text-accent" : "text-ink"}`}>{event.title}</h3>
            <p className="mt-2 max-w-[60ch] text-sm leading-7 text-ink-2">{event.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
