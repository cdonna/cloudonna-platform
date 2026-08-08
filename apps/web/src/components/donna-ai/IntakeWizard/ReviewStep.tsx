import { forwardRef } from "react";
import {
  AI_PLATFORM_OPTIONS,
  ANALYTICS_OPTIONS,
  BUDGET_OPTIONS,
  CLOUD_OPTIONS,
  COUNTRY_OPTIONS,
  CRM_OPTIONS,
  DATA_WAREHOUSE_OPTIONS,
  EMPLOYEE_OPTIONS,
  ERP_OPTIONS,
  GOAL_OPTIONS,
  INDUSTRY_OPTIONS,
  INTERNAL_SKILLS_OPTIONS,
  IT_ORG_SIZE_OPTIONS,
  PREFERRED_CLOUD_OPTIONS,
  PREFERRED_VENDOR_OPTIONS,
  REVENUE_OPTIONS,
  RISK_APPETITE_OPTIONS,
  TIMELINE_OPTIONS,
} from "../data";
import type { WizardState } from "../types";

function labelFor<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T | null,
): string {
  return options.find((option) => option.value === value)?.label ?? "Not specified";
}

function labelsFor<T extends string>(
  options: Array<{ value: T; label: string }>,
  values: T[],
): string {
  if (values.length === 0) return "Not specified";
  return values.map((value) => options.find((o) => o.value === value)?.label ?? value).join(", ");
}

function ReviewCard({
  title,
  summary,
  note,
  onEdit,
}: {
  title: string;
  summary: string;
  note: string;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-nova-ink-faint">{title}</div>
          <p className="mt-1 text-sm text-nova-ink">{summary}</p>
          {note.trim().length > 0 && <p className="mt-1 text-sm italic text-nova-ink-muted">&ldquo;{note}&rdquo;</p>}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 text-sm font-medium text-nova-accent-strong transition-colors duration-control hover:text-nova-ink"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export const ReviewStep = forwardRef<
  HTMLHeadingElement,
  { state: WizardState; onEditStep: (index: number) => void }
>(function ReviewStep({ state, onEditStep }, ref) {
  const companySummary = [
    labelFor(INDUSTRY_OPTIONS, state.company.industry),
    labelFor(COUNTRY_OPTIONS, state.company.country),
    `${labelFor(EMPLOYEE_OPTIONS, state.company.employees)} employees`,
    labelFor(REVENUE_OPTIONS, state.company.revenue),
    `${labelFor(IT_ORG_SIZE_OPTIONS, state.company.itOrgSize)} IT org`,
  ].join(" · ");

  const landscapeSummary = [
    `ERP: ${labelFor(ERP_OPTIONS, state.landscape.erp)}`,
    `CRM: ${labelFor(CRM_OPTIONS, state.landscape.crm)}`,
    `Analytics: ${labelFor(ANALYTICS_OPTIONS, state.landscape.analytics)}`,
    `DWH: ${labelFor(DATA_WAREHOUSE_OPTIONS, state.landscape.dataWarehouse)}`,
    `Cloud: ${labelFor(CLOUD_OPTIONS, state.landscape.cloud)}`,
    `AI: ${labelFor(AI_PLATFORM_OPTIONS, state.landscape.aiPlatform)}`,
  ].join(" · ");

  const contextSummary = `${companySummary} — ${landscapeSummary}`;
  const contextNote = [state.company.note, state.landscape.note].filter((value) => value.trim().length > 0).join(" · ");

  const constraintsSummary = [
    `Budget: ${labelFor(BUDGET_OPTIONS, state.constraints.budget)}`,
    `Timeline: ${labelFor(TIMELINE_OPTIONS, state.constraints.timeline)}`,
    `Risk appetite: ${labelFor(RISK_APPETITE_OPTIONS, state.constraints.riskAppetite)}`,
    `Cloud: ${labelFor(PREFERRED_CLOUD_OPTIONS, state.constraints.preferredCloud)}`,
    `Vendor: ${labelFor(PREFERRED_VENDOR_OPTIONS, state.constraints.preferredVendor)}`,
    `Skills: ${labelFor(INTERNAL_SKILLS_OPTIONS, state.constraints.internalSkills)}`,
  ].join(" · ");

  return (
    <div>
      <p className="text-sm font-medium text-nova-accent-strong">Let&apos;s make sure I&apos;ve got this right before I analyse it.</p>
      <h3 ref={ref} tabIndex={-1} className="mt-2 text-2xl font-semibold text-nova-ink outline-none">
        Review your answers
      </h3>

      <div className="mt-6 space-y-3">
        <ReviewCard title="Context" summary={contextSummary} note={contextNote} onEdit={() => onEditStep(0)} />
        <ReviewCard title="Priorities" summary={labelsFor(GOAL_OPTIONS, state.goals.goals)} note={state.goals.note} onEdit={() => onEditStep(2)} />
        <ReviewCard title="Constraints" summary={constraintsSummary} note={state.constraints.note} onEdit={() => onEditStep(3)} />
      </div>
    </div>
  );
});
