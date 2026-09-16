"use client";

/**
 * The flagship "show, don't tell" component — one illustrative example
 * decision (see example-decisions.ts), worked through end to end: the
 * same shape a real result carries (context, shortlist, recommendation,
 * trade-offs, risks, assumptions, what would change it), plus a public
 * persona lens so a visitor can see the same decision reframed for
 * their own role without running a real assessment. Reused on the
 * homepage ("See ClouDonna think"), /examples, and linked from Decision
 * Skills categories.
 */
import { useState } from "react";
import { DECISION_SKILL_CATEGORIES } from "@/components/decision-skills/catalog";
import { useLocale } from "@/i18n/LocaleProvider";
import { SectionLabel } from "../donna-ai/shared";
import type { ExampleDecision } from "./example-decisions";
import { EvidenceTag } from "./EvidenceTag";
import { SHOWCASE_PERSONAS } from "./personas";

export function DecisionShowcase({ decision }: { decision: ExampleDecision }) {
  const { dict } = useLocale();
  const s = dict.showcase;
  const r = dict.resultOverview;
  const b = dict.executiveBrief;
  const [activePersonaId, setActivePersonaId] = useState(SHOWCASE_PERSONAS[0].id);
  const activeTakeaway = decision.personaTakeaways.find((takeaway) => takeaway.persona === activePersonaId);
  const skillLabels = decision.decisionSkills
    .map((id) => DECISION_SKILL_CATEGORIES.find((category) => category.id === id)?.label)
    .filter((label): label is string => Boolean(label));

  return (
    <div className="overflow-hidden rounded-[2rem] border border-titanium bg-carbon shadow-nova-glow">
      <div className="border-b border-titanium p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-titanium bg-carbon-2 px-3 py-1 text-[10px] font-semibold tracking-[0.1em] text-nova-ink-faint uppercase">
            {s.illustrativeLabel}
          </span>
          {skillLabels.map((label) => (
            <span key={label} className="rounded-full border border-titanium bg-carbon-2 px-3 py-1 text-[10px] font-medium text-nova-ink-muted">
              {label}
            </span>
          ))}
        </div>
        <h3 className="mt-4 text-2xl font-semibold tracking-tight text-nova-ink">{decision.title}</h3>
        <p className="mt-2 text-sm leading-6 text-nova-ink-muted">{decision.question}</p>
      </div>

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <SectionLabel>{s.contextHeading}</SectionLabel>
            <EvidenceTag type="customer-input" />
          </div>
          <p className="mt-2 text-sm leading-6 text-nova-ink-muted">{decision.context}</p>

          <div className="mt-6">
            <SectionLabel>{s.prioritiesHeading}</SectionLabel>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {decision.priorities.map((priority) => (
                <span key={priority} className="rounded-full border border-titanium bg-carbon-2 px-3 py-1.5 text-xs text-nova-ink-muted">
                  {priority}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <SectionLabel>{s.shortlistHeading}</SectionLabel>
            <div className="mt-2 space-y-2">
              {decision.shortlist.map((option) => {
                const isRecommended = option.name === decision.recommendedOptionName;
                return (
                  <div
                    key={option.name}
                    className={`rounded-xl border p-3.5 ${isRecommended ? "border-nova-success/30 bg-nova-success/10" : "border-titanium bg-carbon-2"}`}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className={isRecommended ? "font-semibold text-nova-ink" : "font-medium text-nova-ink-muted"}>{option.name}</span>
                      {isRecommended && (
                        <span className="rounded-full bg-nova-success/15 px-2 py-0.5 text-[10px] font-semibold text-nova-success uppercase">
                          {r.recommendedBadge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-nova-ink-faint">{option.fitSummary}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-nova-success/25 bg-nova-success/10 p-5">
            <div className="flex items-center gap-2">
              <SectionLabel>{r.recommendationLabel}</SectionLabel>
              <EvidenceTag type="calculated" />
            </div>
            <div className="mt-1.5 text-lg font-semibold text-nova-ink">{decision.recommendation}</div>
            <div className="mt-3 flex items-start gap-2">
              <p className="text-sm leading-6 text-nova-ink-muted">{decision.recommendationRationale}</p>
            </div>
            <div className="mt-2">
              <EvidenceTag type="ai-interpretation" />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-titanium bg-carbon-2 p-5">
            <SectionLabel>{r.readAsLabel}</SectionLabel>
            <div role="tablist" aria-label={r.readAsLabel} className="mt-3 flex flex-wrap gap-1.5">
              {SHOWCASE_PERSONAS.map((persona) => {
                const isActive = persona.id === activePersonaId;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActivePersonaId(persona.id)}
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
            {activeTakeaway && <p className="mt-4 text-sm leading-6 text-nova-ink-muted">{activeTakeaway.takeaway}</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 border-t border-titanium p-6 sm:p-8 lg:grid-cols-3">
        <div>
          <SectionLabel>{b.tradeOffsHeading}</SectionLabel>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-nova-ink-muted">
            {decision.tradeOffs.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-ink-faint" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <SectionLabel>{b.risksHeading}</SectionLabel>
            <EvidenceTag type="calculated" />
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-nova-ink-muted">
            {decision.risks.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-warning" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <SectionLabel>{b.assumptionsHeading}</SectionLabel>
            <EvidenceTag type="assumption" />
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-nova-ink-muted">
            {decision.assumptions.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-nova-ink-faint" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-titanium bg-carbon-2 p-6 sm:p-8">
        <SectionLabel>{r.whatWouldChangeHeading}</SectionLabel>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {decision.whatWouldChange.map((trigger) => (
            <div key={trigger.option} className="rounded-xl border border-titanium bg-carbon p-4 text-sm leading-6 text-nova-ink-muted">
              <span className="font-semibold text-nova-accent-strong">{trigger.option}</span> becomes the better fit if {trigger.condition.toLowerCase()}.
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
