import { CircleDot, FileClock, GitCompare, RefreshCcw, Scale } from "lucide-react";
import {
  Display,
  Eyebrow,
  FrameField,
  FramePanel,
  IllustrativeLabel,
  Lede,
  Numeral,
  ProductFrame,
  Section,
  Shell,
  Tag,
} from "@/components/editorial/primitives";
import { DecisionShowcase } from "@/components/showcase/DecisionShowcase";
import { EXAMPLE_DECISIONS } from "@/components/showcase/example-decisions";
import { JOURNEY_DECISION, type MemoryEventKind } from "@/components/landing/journey-content";
import type { Dictionary } from "@/i18n/dictionary";

/**
 * 01 UNDERSTAND → 05 REMEMBER. The homepage's central storytelling
 * device, and the thing that replaced the old sequence of
 * marketing-card sections (Problem's three symptom cards,
 * EnterpriseIntelligence's three pillar cards, Ecosystem's five product
 * cards).
 *
 * Two rules hold across all five steps:
 *
 * 1. One decision, followed end to end. Every canvas renders the same
 *    SAP BW modernization composite (journey-content.ts), and step 03
 *    renders the *actual* DecisionShowcase component the /examples page
 *    uses — not a picture of it. Nothing here claims functionality the
 *    product doesn't have: every field shown corresponds to a field the
 *    real decision record carries.
 * 2. The product canvas outweighs the prose. Each step's editorial
 *    column is capped at ~40rem; the canvas gets the full shell width.
 *
 * `register="dark"` on step 05 is the brief's "dark sections used
 * intentionally": Decision Memory is the one claim on this page about
 * something that persists, and it is the only full-width dark beat
 * before the closing CTA.
 */

function StepHeader({
  number,
  label,
  heading,
  body,
  size = 3,
  className = "",
}: {
  number: string;
  label: string;
  heading: string;
  body: string;
  /** 05 Remember is set one step larger than the other four: it carries
   * the one line on the homepage that has to be remembered, and giving
   * it the largest type in the journey is cheaper than repeating it. */
  size?: 2 | 3;
  className?: string;
}) {
  return (
    <div className={`${size === 2 ? "max-w-[46rem]" : "max-w-[40rem]"} ${className}`}>
      <Numeral>{number}</Numeral>
      <Eyebrow className="mt-1">{label}</Eyebrow>
      <Display size={size} className="mt-5">
        {heading}
      </Display>
      <Lede className="mt-5">{body}</Lede>
    </div>
  );
}

/* -------------------------------------------------------------------- */

function Understand({ dict }: { dict: Dictionary }) {
  const u = dict.journey.understand;
  const d = JOURNEY_DECISION;

  return (
    <Section size="lg">
      <Shell>
        <StepHeader number={u.number} label={u.label} heading={u.heading} body={u.body} />

        <ProductFrame className="mt-14" label={u.frame} meta={dict.showcase.illustrativeLabel}>
          <div className="grid gap-px bg-rule lg:grid-cols-[1.15fr_1fr]">
            <div className="bg-paper p-6 sm:p-8">
              <FrameField label={u.contextLabel}>{d.context}</FrameField>

              <FrameField label={u.prioritiesLabel} className="mt-8">
                {/* Ordered, because a priority list that isn't ranked is a
                    wish list. The numeral is the rank. */}
                <ol className="space-y-2.5">
                  {d.priorities.map((priority, index) => (
                    <li key={priority} className="flex gap-3">
                      <span aria-hidden="true" className="font-mono text-xs text-accent tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-ink">{priority}</span>
                    </li>
                  ))}
                </ol>
              </FrameField>

              <FrameField label={u.stakeholdersLabel} className="mt-8">
                <div className="flex flex-wrap gap-1.5">
                  {d.stakeholders.map((stakeholder) => (
                    <Tag key={stakeholder}>{stakeholder}</Tag>
                  ))}
                </div>
              </FrameField>
            </div>

            <div className="bg-paper p-6 sm:p-8">
              <FrameField label={u.landscapeLabel}>
                <dl className="divide-y divide-rule">
                  {d.landscape.map((entry) => (
                    <div key={entry.label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0">
                      <dt className="text-ink-3">{entry.label}</dt>
                      <dd className="text-right text-ink">{entry.value}</dd>
                    </div>
                  ))}
                </dl>
              </FrameField>

              <FramePanel tone="raised" className="mt-8">
                <FrameField label={u.constraintsLabel}>
                  <ul className="space-y-2.5">
                    {d.constraints.map((constraint) => (
                      <li key={constraint} className="flex gap-2.5">
                        <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-accent" />
                        <span className="text-ink">{constraint}</span>
                      </li>
                    ))}
                  </ul>
                </FrameField>
              </FramePanel>
            </div>
          </div>
        </ProductFrame>
      </Shell>
    </Section>
  );
}

/* -------------------------------------------------------------------- */

function Compare({ dict }: { dict: Dictionary }) {
  const c = dict.journey.compare;
  const rows = JOURNEY_DECISION.compare;
  const columns = [
    { label: c.architectureLabel, read: (row: (typeof rows)[number]) => row.architecture },
    { label: c.commercialLabel, read: (row: (typeof rows)[number]) => row.commercial },
    { label: c.riskLabel, read: (row: (typeof rows)[number]) => row.risk },
    { label: c.dependencyLabel, read: (row: (typeof rows)[number]) => row.dependency },
  ];

  return (
    <Section size="lg" tone="sunken">
      <Shell>
        <StepHeader number={c.number} label={c.label} heading={c.heading} body={c.body} />

        <ProductFrame className="mt-14" label={c.frame} meta={dict.showcase.illustrativeLabel}>
          {/* Desktop: one real comparison table, so four alternatives can
              be read across a single dimension at a time. */}
          <table className="hidden w-full border-collapse text-left lg:table">
            <thead>
              <tr className="border-b border-rule">
                <th scope="col" className="w-[20%] px-6 py-4 font-mono text-label font-medium text-ink-3 uppercase">
                  {c.alternativeLabel}
                </th>
                {columns.map((column) => (
                  <th key={column.label} scope="col" className="px-6 py-4 font-mono text-label font-medium text-ink-3 uppercase">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className={`border-b border-rule last:border-0 ${row.recommended ? "bg-accent-wash" : ""}`}>
                  <th scope="row" className="px-6 py-5 align-top text-sm font-medium text-ink">
                    {row.name}
                    {row.recommended && (
                      <span className="mt-2 block font-mono text-label font-medium text-accent uppercase">{dict.resultOverview.recommendedBadge}</span>
                    )}
                  </th>
                  {columns.map((column) => (
                    <td key={column.label} className="px-6 py-5 align-top text-sm leading-6 text-ink-2">
                      {column.read(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: the same four alternatives as stacked records, not a
              desktop table squeezed into 390px or pushed into a
              horizontal scroll nobody discovers. */}
          <div className="divide-y divide-rule lg:hidden">
            {rows.map((row) => (
              <div key={row.name} className={`p-6 ${row.recommended ? "bg-accent-wash" : ""}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-medium text-ink">{row.name}</h3>
                  {row.recommended && (
                    <span className="font-mono text-label font-medium text-accent uppercase">{dict.resultOverview.recommendedBadge}</span>
                  )}
                </div>
                <dl className="mt-4 space-y-4">
                  {columns.map((column) => (
                    <div key={column.label}>
                      <dt className="font-mono text-label font-medium text-ink-3 uppercase">{column.label}</dt>
                      <dd className="mt-1 text-sm leading-6 text-ink-2">{column.read(row)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </ProductFrame>
      </Shell>
    </Section>
  );
}

/* -------------------------------------------------------------------- */

function Decide({ dict }: { dict: Dictionary }) {
  const d = dict.journey.decide;

  return (
    <Section size="lg">
      <Shell>
        <StepHeader number={d.number} label={d.label} heading={d.heading} body={d.body} />

        {/* The real component, not a mock of it: this is the same
            DecisionShowcase /examples renders, on the same decision the
            two steps above worked through. */}
        <div className="mt-14">
          <DecisionShowcase decision={EXAMPLE_DECISIONS[0]} />
        </div>
      </Shell>
    </Section>
  );
}

/* -------------------------------------------------------------------- */

function Align({ dict }: { dict: Dictionary }) {
  const a = dict.journey.align;

  return (
    <Section size="lg" tone="sunken">
      <Shell>
        <StepHeader number={a.number} label={a.label} heading={a.heading} body={a.body} />

        <ProductFrame className="mt-14" label={a.frame} meta={dict.showcase.illustrativeLabel}>
          <div className="border-b border-rule px-6 py-4 sm:px-8">
            <div className="font-mono text-label font-medium text-ink-3 uppercase">{a.readsAsLabel}</div>
            <p className="mt-2 text-sm text-ink">{JOURNEY_DECISION.question}</p>
          </div>

          <div className="divide-y divide-rule">
            {JOURNEY_DECISION.align.map((reading) => (
              <div key={reading.role} className="grid gap-4 px-6 py-7 sm:px-8 lg:grid-cols-[10rem_1fr] lg:gap-10">
                <div>
                  <div className="text-sm font-medium text-accent">{a.roles[reading.role]}</div>
                  <p className="mt-2 text-sm leading-6 text-ink-3 italic">{reading.question}</p>
                </div>
                <p className="text-sm leading-7 text-ink-2 lg:text-[0.9375rem]">{reading.reading}</p>
              </div>
            ))}
          </div>
        </ProductFrame>
      </Shell>
    </Section>
  );
}

/* -------------------------------------------------------------------- */

const MEMORY_ICONS: Record<MemoryEventKind, typeof CircleDot> = {
  created: CircleDot,
  evidence: FileClock,
  assumption: Scale,
  vendor: GitCompare,
  review: RefreshCcw,
};

function Remember({ dict }: { dict: Dictionary }) {
  const r = dict.journey.remember;
  const holds = JOURNEY_DECISION.verdict === "holds";

  return (
    <Section size="xl" register="dark">
      <Shell>
        <StepHeader number={r.number} label={r.label} heading={r.heading} body={r.body} size={2} />

        <div className="mt-16 grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div>
            <div className="font-mono text-label font-medium text-ink-3 uppercase">{r.eventsLabel}</div>

            {/* A single continuous rule down the left, so the five events
                read as one history rather than five cards. */}
            <ol className="mt-7 border-l border-rule">
              {JOURNEY_DECISION.memory.map((event) => {
                const Icon = MEMORY_ICONS[event.kind];
                return (
                  <li key={event.title} className="relative pb-10 pl-8 last:pb-0">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[0.5625rem] top-0.5 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full bg-paper text-accent"
                    >
                      <Icon size={13} />
                    </span>
                    <div className="font-mono text-label font-medium text-ink-3 uppercase">{event.when}</div>
                    <h3 className="mt-2 text-base font-medium text-ink">{event.title}</h3>
                    <p className="mt-2 max-w-[44ch] text-sm leading-6 text-ink-2">{event.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="lg:pt-14">
            <div
              className={`border-l-2 pl-7 ${holds ? "border-sig-positive" : "border-sig-caution"}`}
            >
              <div className={`font-mono text-label font-medium uppercase ${holds ? "text-sig-positive" : "text-sig-caution"}`}>
                {holds ? r.verdictHolds : r.verdictReview}
              </div>
              <p className="mt-4 text-[1.0625rem] leading-7 text-ink">{JOURNEY_DECISION.verdictReason}</p>
              <p className="mt-5 text-sm leading-6 text-ink-3">{r.verdictNote}</p>
            </div>

            <div className="mt-10 pl-7">
              <IllustrativeLabel>{dict.showcase.illustrativeLabel}</IllustrativeLabel>
            </div>
          </div>
        </div>
      </Shell>
    </Section>
  );
}

/* -------------------------------------------------------------------- */

export default function DecisionJourney({ dict }: { dict: Dictionary }) {
  return (
    <>
      <Section size="md" className="pb-0">
        <Shell>
          <div className="max-w-[44rem] border-t border-rule pt-12">
            <Eyebrow>{dict.journey.eyebrow}</Eyebrow>
            <Display size={2} className="mt-6">
              {dict.journey.heading}
            </Display>
          </div>
        </Shell>
      </Section>
      <Understand dict={dict} />
      <Compare dict={dict} />
      <Decide dict={dict} />
      <Align dict={dict} />
      <Remember dict={dict} />
    </>
  );
}
