"use client";

/**
 * Understand stage (brief §5/§6) — the Decision Frame, built entirely
 * from data already captured by the existing intake wizard
 * (WizardState) and DecisionInput's enterprise-context seam. Nothing
 * here is re-entered: a user never sees a blank field for data the
 * product already has (brief §5's own "do not make users re-enter
 * data already stored").
 *
 * No new persisted "decision question"/"strategic objective"/"success
 * criteria" fields were added for this — title, goals.goals, and
 * desiredOutcomes already cover that ground honestly; see the
 * capability doc's Known Limitations for what genuinely has no home
 * yet (e.g. a dedicated decision-type taxonomy).
 */
import type { ReactNode } from "react";
import { SectionLabel } from "../../shared";
import type { DecisionInput } from "../../intelligence/types";
import type { RankedPlatform } from "../../scoring/types";
import type { BusinessCaseOutput } from "../../engine/business-case/types";

function formatChf(value: number): string {
  return new Intl.NumberFormat("en-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
}

function titleCase(value: string | null): string {
  if (!value) return "Not specified";
  return value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function UnderstandStage({
  title,
  decisionInput,
  ranked,
  businessCase,
  editAction,
}: {
  title: string;
  decisionInput: DecisionInput;
  ranked: RankedPlatform[];
  businessCase: BusinessCaseOutput | null | undefined;
  editAction?: ReactNode;
}) {
  const { wizardState, enterpriseContext, desiredOutcomes, organizationContext } = decisionInput;
  const investmentAtStake = businessCase?.options[0]?.summary.tco ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Decision Frame</SectionLabel>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-nova-ink">{title}</h3>
          {organizationContext?.organizationName && <p className="mt-1 text-sm text-nova-ink-faint">{organizationContext.organizationName}</p>}
        </div>
        {editAction}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-titanium bg-carbon p-5">
          <SectionLabel>Strategic objectives</SectionLabel>
          {wizardState.goals.goals.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {wizardState.goals.goals.map((goal) => (
                <span key={goal} className="rounded-full bg-carbon-2 px-3 py-1 text-xs font-medium text-nova-ink-muted">
                  {titleCase(goal)}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-nova-ink-faint">No strategic objectives recorded yet.</p>
          )}
          {wizardState.goals.note && <p className="mt-3 text-sm leading-6 text-nova-ink-muted">{wizardState.goals.note}</p>}
        </div>

        <div className="rounded-2xl border border-titanium bg-carbon p-5">
          <SectionLabel>Options under consideration</SectionLabel>
          <ul className="mt-3 space-y-1.5">
            {ranked.map((r) => (
              <li key={r.platform.id} className="text-sm text-nova-ink-muted">
                {r.platform.vendor} {r.platform.productName}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-titanium bg-carbon p-5">
          <SectionLabel>Constraints</SectionLabel>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-nova-ink-faint">Budget</dt>
            <dd className="text-right text-nova-ink">{titleCase(wizardState.constraints.budget)}</dd>
            <dt className="text-nova-ink-faint">Timeline</dt>
            <dd className="text-right text-nova-ink">{titleCase(wizardState.constraints.timeline)}</dd>
            <dt className="text-nova-ink-faint">Risk appetite</dt>
            <dd className="text-right text-nova-ink">{titleCase(wizardState.constraints.riskAppetite)}</dd>
            <dt className="text-nova-ink-faint">Preferred cloud</dt>
            <dd className="text-right text-nova-ink">{titleCase(wizardState.constraints.preferredCloud)}</dd>
            <dt className="text-nova-ink-faint">Preferred vendor</dt>
            <dd className="text-right text-nova-ink">{titleCase(wizardState.constraints.preferredVendor)}</dd>
            <dt className="text-nova-ink-faint">Internal skills</dt>
            <dd className="text-right text-nova-ink">{titleCase(wizardState.constraints.internalSkills)}</dd>
          </dl>
        </div>

        <div className="rounded-2xl border border-titanium bg-carbon p-5">
          <SectionLabel>Deadline &amp; investment at stake</SectionLabel>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-nova-ink-faint">Decision deadline</dt>
              <dd className="text-nova-ink">{enterpriseContext?.migrationDeadline ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-nova-ink-faint">Investment at stake</dt>
              <dd className="text-nova-ink">{investmentAtStake !== null ? formatChf(investmentAtStake) : "Not yet modeled"}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-nova-ink-faint">
            Investment at stake is the recommended option&apos;s own modeled TCO — the customer&apos;s own economic stake in this decision, never ClouDonna&apos;s commercial deal size.
          </p>
        </div>

        {desiredOutcomes && desiredOutcomes.length > 0 && (
          <div className="rounded-2xl border border-titanium bg-carbon p-5 lg:col-span-2">
            <SectionLabel>Success criteria</SectionLabel>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-nova-ink-muted">
              {desiredOutcomes.map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
          </div>
        )}

        {enterpriseContext && (enterpriseContext.regulatoryRequirements?.length || enterpriseContext.operatingRegions?.length || enterpriseContext.existingLicenses?.length) ? (
          <div className="rounded-2xl border border-titanium bg-carbon p-5 lg:col-span-2">
            <SectionLabel>Enterprise context</SectionLabel>
            <div className="mt-3 space-y-2 text-sm">
              {enterpriseContext.regulatoryRequirements && enterpriseContext.regulatoryRequirements.length > 0 && (
                <p className="text-nova-ink-muted">
                  <span className="text-nova-ink-faint">Regulatory: </span>
                  {enterpriseContext.regulatoryRequirements.join(", ")}
                </p>
              )}
              {enterpriseContext.operatingRegions && enterpriseContext.operatingRegions.length > 0 && (
                <p className="text-nova-ink-muted">
                  <span className="text-nova-ink-faint">Operating regions: </span>
                  {enterpriseContext.operatingRegions.join(", ")}
                </p>
              )}
              {enterpriseContext.existingLicenses && enterpriseContext.existingLicenses.length > 0 && (
                <p className="text-nova-ink-muted">
                  <span className="text-nova-ink-faint">Existing licenses: </span>
                  {enterpriseContext.existingLicenses.join(", ")}
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
