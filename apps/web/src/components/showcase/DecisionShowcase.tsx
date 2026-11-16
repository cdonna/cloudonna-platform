"use client";

/**
 * The flagship "show, don't tell" component — one illustrative example
 * decision (see example-decisions.ts), worked through end to end: the
 * same shape a real result carries (context, shortlist, recommendation,
 * trade-offs, risks, assumptions, what would change it), plus a public
 * persona lens so a visitor can see the same decision reframed for
 * their own role without running a real assessment. Reused as the
 * homepage's 03 Decide step, on /examples, and linked from Decision
 * Skills categories.
 *
 * It is now built on the editorial ProductFrame, which carries its own
 * `register-dark`: on a warm paper page this reads as the one dark
 * application surface in the section, which is exactly what it is. That
 * register is also what makes the EvidenceTag labels inside resolve to
 * their dark values without this component knowing anything about them.
 */
import { useState } from "react";
import { DECISION_SKILL_CATEGORIES } from "@/components/decision-skills/catalog";
import { FrameField, FramePanel, ProductFrame, Tag } from "@/components/editorial/primitives";
import { useLocale } from "@/i18n/LocaleProvider";
import type { ExampleDecision } from "./example-decisions";
import { EvidenceTag } from "./EvidenceTag";
import { SHOWCASE_PERSONAS } from "./personas";

function BulletList({ items, marker = "neutral" }: { items: string[]; marker?: "neutral" | "caution" }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span
            aria-hidden="true"
            className={`mt-2.5 h-px w-3 shrink-0 ${marker === "caution" ? "bg-sig-caution" : "bg-ink-3"}`}
          />
          <span className="text-ink-2">{item}</span>
        </li>
      ))}
    </ul>
  );
}

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
    <ProductFrame label={dict.journey.decide.frame} meta={s.illustrativeLabel}>
      <div className="border-b border-rule p-6 sm:p-8">
        <h3 className="text-display-3 font-medium text-ink">{decision.title}</h3>
        <p className="mt-3 max-w-[70ch] text-[0.9375rem] leading-7 text-ink-2">{decision.question}</p>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {skillLabels.map((label) => (
            <Tag key={label}>{label}</Tag>
          ))}
        </div>
      </div>

      <div className="grid gap-px bg-rule lg:grid-cols-2">
        <div className="bg-paper p-6 sm:p-8">
          <FrameField label={s.contextHeading}>
            <div className="mb-2">
              <EvidenceTag type="customer-input" />
            </div>
            {decision.context}
          </FrameField>

          <FrameField label={s.prioritiesHeading} className="mt-8">
            <div className="flex flex-wrap gap-1.5">
              {decision.priorities.map((priority) => (
                <Tag key={priority}>{priority}</Tag>
              ))}
            </div>
          </FrameField>

          <FrameField label={s.shortlistHeading} className="mt-8">
            <div className="divide-y divide-rule border-t border-rule">
              {decision.shortlist.map((option) => {
                const isRecommended = option.name === decision.recommendedOptionName;
                return (
                  <div key={option.name} className="py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className={isRecommended ? "font-medium text-ink" : "text-ink-2"}>{option.name}</span>
                      {isRecommended && (
                        <span className="shrink-0 font-mono text-label font-medium text-accent uppercase">{r.recommendedBadge}</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-ink-3">{option.fitSummary}</p>
                  </div>
                );
              })}
            </div>
          </FrameField>
        </div>

        <div className="bg-paper p-6 sm:p-8">
          <FramePanel tone="accent">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-label font-medium text-ink-3 uppercase">{r.recommendationLabel}</span>
              <EvidenceTag type="calculated" />
            </div>
            <p className="mt-3 text-[1.0625rem] leading-snug font-medium text-ink">{decision.recommendation}</p>
            <p className="mt-4 text-sm leading-7 text-ink-2">{decision.recommendationRationale}</p>
            <div className="mt-4">
              <EvidenceTag type="ai-interpretation" />
            </div>
          </FramePanel>

          <FramePanel tone="raised" className="mt-5">
            <div className="font-mono text-label font-medium text-ink-3 uppercase">{r.readAsLabel}</div>
            <div role="tablist" aria-label={r.readAsLabel} className="mt-4 flex flex-wrap gap-1.5">
              {SHOWCASE_PERSONAS.map((persona) => {
                const isActive = persona.id === activePersonaId;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActivePersonaId(persona.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors duration-control focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none ${
                      isActive ? "border-transparent bg-solid font-medium text-solid-on" : "border-rule bg-paper text-ink-2 hover:text-ink"
                    }`}
                  >
                    {persona.label}
                  </button>
                );
              })}
            </div>
            {activeTakeaway && <p className="mt-5 text-sm leading-7 text-ink-2">{activeTakeaway.takeaway}</p>}
          </FramePanel>
        </div>
      </div>

      <div className="grid gap-px border-t border-rule bg-rule lg:grid-cols-3">
        <div className="bg-paper p-6 sm:p-8">
          <FrameField label={b.tradeOffsHeading}>
            <BulletList items={decision.tradeOffs} />
          </FrameField>
        </div>
        <div className="bg-paper p-6 sm:p-8">
          <FrameField label={b.risksHeading}>
            <div className="mb-2">
              <EvidenceTag type="calculated" />
            </div>
            <BulletList items={decision.risks} marker="caution" />
          </FrameField>
        </div>
        <div className="bg-paper p-6 sm:p-8">
          <FrameField label={b.assumptionsHeading}>
            <div className="mb-2">
              <EvidenceTag type="assumption" />
            </div>
            <BulletList items={decision.assumptions} />
          </FrameField>
        </div>
      </div>

      <div className="border-t border-rule bg-paper-3 p-6 sm:p-8">
        <FrameField label={r.whatWouldChangeHeading}>
          <div className="mt-2 grid gap-x-10 gap-y-4 sm:grid-cols-2">
            {decision.whatWouldChange.map((trigger) => (
              <div key={trigger.option} className="border-t border-rule pt-4 text-sm leading-7 text-ink-2">
                <span className="font-medium text-accent">{trigger.option}</span> becomes the better fit if{" "}
                {trigger.condition.toLowerCase()}.
              </div>
            ))}
          </div>
        </FrameField>
      </div>
    </ProductFrame>
  );
}
