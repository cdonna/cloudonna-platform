import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { listCommercialOpportunities } from "@/lib/commercial/repository";
import { listAllContracts } from "@/lib/commercial/contracts-repository";
import { listAllInvoices } from "@/lib/commercial/invoices-repository";
import { listDecisionSprints } from "@/lib/commercial/sprints-repository";
import { listAllConversions } from "@/lib/commercial/conversions-repository";
import { listAllStageChangeActivities } from "@/lib/commercial/activities-repository";
import { listAccountIdsWithEconomicBuyer } from "@/lib/commercial/contacts-repository";
import { computeRevenuePosition } from "@/lib/commercial/revenue-position";
import { computeCommercialFunnel, FUNNEL_STAGE_LABELS } from "@/lib/commercial/funnel";
import { computeSalesVelocity, deriveStageTransitionSamples } from "@/lib/commercial/sales-velocity";
import { computeScenario, DEFAULT_SCENARIOS } from "@/lib/commercial/scenario-planning";
import { FIRST_MILLION_TARGET_CHF } from "@/lib/commercial/target-model";
import { COMMERCIAL_PACKAGES, type CommercialPackageId } from "@/lib/commercial/packages";
import { OPPORTUNITY_STAGE_LABELS, OPPORTUNITY_STAGES, type OpportunityStage } from "@/lib/commercial/opportunity-stages";
import { HYGIENE_ISSUE_LABELS } from "@/lib/commercial/pipeline-hygiene";

export const metadata: Metadata = {
  title: "Commercial — ClouDonna",
};

function formatChf(value: number): string {
  return new Intl.NumberFormat("en-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
}

function isOpportunityStage(value: string | null): value is OpportunityStage {
  return value !== null && (OPPORTUNITY_STAGES as readonly string[]).includes(value);
}

function formatDays(days: number | null): string {
  return days === null ? "Insufficient data" : `${days.toFixed(0)} days`;
}

/**
 * The First CHF 1M Control Panel (brief §24) — upgraded from
 * Commercial Engine V1's single-page summary into the executive
 * Revenue Operations view: real signed bookings/ARR/TCV/cash (from
 * commercial_contracts/commercial_invoices, never guessed from
 * opportunity "expected" fields), pipeline coverage, Decision Sprint
 * delivery status, Sprint->Team/Team->Enterprise conversion counts,
 * pipeline hygiene, next actions due, the conversion funnel, sales
 * velocity, and the BASE/UPSIDE/DOWNSIDE scenario comparison. Still
 * platform-staff-only, same access check as every other /app/commercial
 * page.
 */
export default async function CommercialDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return <RestrictedNotice reason="Sign in to view this page." />;

  const supabase = await createSupabaseServerClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return <RestrictedNotice reason="This area is restricted to ClouDonna platform staff." />;

  const [opportunitiesResult, contractsResult, invoicesResult, sprintsResult, conversionsResult, activitiesResult, accountIdsWithEconomicBuyer] = await Promise.all([
    listCommercialOpportunities(supabase),
    listAllContracts(supabase),
    listAllInvoices(supabase),
    listDecisionSprints(supabase),
    listAllConversions(supabase),
    listAllStageChangeActivities(supabase),
    listAccountIdsWithEconomicBuyer(supabase),
  ]);

  const opportunities = opportunitiesResult.ok ? opportunitiesResult.data : [];
  const contracts = contractsResult.ok ? contractsResult.data : [];
  const invoices = invoicesResult.ok ? invoicesResult.data : [];
  const sprints = sprintsResult.ok ? sprintsResult.data : [];
  const conversions = conversionsResult.ok ? conversionsResult.data : [];
  const activities = activitiesResult.ok ? activitiesResult.data : [];

  const position = computeRevenuePosition(opportunities, contracts, invoices, sprints, conversions, accountIdsWithEconomicBuyer, {
    targetBookingsChf: FIRST_MILLION_TARGET_CHF,
  });

  const funnel = computeCommercialFunnel(
    opportunities,
    activities.map((a) => ({
      opportunityId: a.opportunityId,
      stageAfter: isOpportunityStage(a.afterStage) ? a.afterStage : null,
    })),
    {
      sprintCompletedCount: position.sprintsCompleted,
      teamConversionCount: position.sprintToTeamConversionCount,
      enterpriseExpansionCount: position.teamToEnterpriseConversionCount,
    },
  );

  const derivedTransitions = deriveStageTransitionSamples(opportunities, activities.map((a) => ({ opportunityId: a.opportunityId, afterStage: a.afterStage, createdAt: a.createdAt })));
  const velocity = computeSalesVelocity({
    ...derivedTransitions,
    signedToSprintStart: sprints
      .filter((s) => s.opportunityId && s.startDate)
      .map((s) => {
        const opp = opportunities.find((o) => o.id === s.opportunityId);
        return opp?.closedAt && s.startDate ? { fromTimestamp: opp.closedAt, toTimestamp: s.startDate } : null;
      })
      .filter((v): v is { fromTimestamp: string; toTimestamp: string } => v !== null),
    sprintStartToCompletion: sprints
      .filter((s) => s.status === "completed" && s.startDate)
      .map((s) => ({ fromTimestamp: s.startDate as string, toTimestamp: s.updatedAt })),
    completionToExpansion: conversions
      .filter((c) => c.fromSprintId !== null && c.conversionDate !== null)
      .map((c) => {
        const sprint = sprints.find((s) => s.id === c.fromSprintId);
        return sprint?.updatedAt && c.conversionDate ? { fromTimestamp: sprint.updatedAt, toTimestamp: c.conversionDate } : null;
      })
      .filter((v): v is { fromTimestamp: string; toTimestamp: string } => v !== null),
  });

  const baseScenario = computeScenario(DEFAULT_SCENARIOS.base);
  const upsideScenario = computeScenario(DEFAULT_SCENARIOS.upside);
  const downsideScenario = computeScenario(DEFAULT_SCENARIOS.downside);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Commercial</h1>
          <p className="mt-2 text-sm text-nova-ink-muted">
            First CHF 1M bookings — a planning scenario, not a forecast. Every number below is a real sum over {opportunities.length} opportunit
            {opportunities.length === 1 ? "y" : "ies"}, never a vanity metric.
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href="/app/commercial/accounts" className="rounded-full border border-titanium bg-carbon px-4 py-2 text-nova-ink-muted transition-colors hover:text-nova-ink">
            Accounts
          </Link>
          <Link href="/app/commercial/sprints" className="rounded-full border border-titanium bg-carbon px-4 py-2 text-nova-ink-muted transition-colors hover:text-nova-ink">
            Decision Sprints
          </Link>
          {/* A file-download attachment response, not a page route — a plain anchor is the correct element here, not next/link. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/commercial/opportunities/export" className="rounded-full border border-titanium bg-carbon px-4 py-2 text-nova-ink-muted transition-colors hover:text-nova-ink">
            Export CSV
          </a>
        </div>
      </div>

      {!opportunitiesResult.ok && (
        <p role="alert" className="mt-6 text-sm text-red-400">
          {opportunitiesResult.reason}
        </p>
      )}

      {/* First CHF 1M position */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Target" value={formatChf(position.targetBookingsChf)} />
        <MetricCard label="Booked (signed)" value={formatChf(position.bookedChf)} accent={position.bookedChf > 0} />
        <MetricCard label="ARR (signed)" value={formatChf(position.arrChf)} />
        <MetricCard label="TCV (signed)" value={formatChf(position.tcvChf)} />
        <MetricCard label="Cash collected" value={formatChf(position.cashCollectedChf)} />
        <MetricCard label="Coverage" value={position.pipeline.coverageRatio === null ? "—" : `${position.pipeline.coverageRatio.toFixed(1)}x`} />
      </div>
      {position.excludedNonChfContractCount > 0 && (
        <p className="mt-2 text-xs text-nova-warning">
          {position.excludedNonChfContractCount} signed contract{position.excludedNonChfContractCount === 1 ? "" : "s"} in a non-CHF currency with no approved CHF planning value
          excluded from the totals above — add one on the opportunity to include it.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Open pipeline" value={formatChf(position.pipeline.pipelineValueChf)} />
        <MetricCard label="Weighted pipeline" value={formatChf(position.pipeline.weightedPipelineValueChf)} />
        <MetricCard label="Remaining to target" value={formatChf(position.pipeline.remainingToTargetChf)} />
        <MetricCard label="Open opportunities" value={String(position.openOpportunityCount)} />
      </div>

      {/* Decision Sprint delivery */}
      <SectionHeading>Decision Sprint delivery</SectionHeading>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Sprints active" value={String(position.sprintsActive)} accent={position.capacity.atCapacity} />
        <MetricCard label="Sprints completed" value={String(position.sprintsCompleted)} />
        <MetricCard label="Sprint → Team conversions" value={String(position.sprintToTeamConversionCount)} />
        <MetricCard label="Team → Enterprise expansions" value={String(position.teamToEnterpriseConversionCount)} />
      </div>
      {position.capacity.atCapacity && (
        <p className="mt-2 text-xs text-nova-warning">
          At delivery capacity ({position.capacity.maxConcurrentSprints} concurrent sprints) — new Sprint commitments should wait for a slot to free up.
        </p>
      )}

      {/* Package breakdown */}
      <SectionHeading>By package</SectionHeading>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(COMMERCIAL_PACKAGES) as CommercialPackageId[]).map((id) => {
          const open = opportunities.filter((o) => o.commercialPackage === id && o.stage !== "closed_won" && o.stage !== "closed_lost").length;
          const closedWon = opportunities.filter((o) => o.commercialPackage === id && o.stage === "closed_won").length;
          return (
            <div key={id} className="rounded-2xl border border-titanium bg-carbon p-4">
              <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">{COMMERCIAL_PACKAGES[id].name}</p>
              <p className="mt-2 text-sm text-nova-ink">{open} open</p>
              <p className="text-sm text-nova-ink-muted">{closedWon} closed won</p>
            </div>
          );
        })}
      </div>

      {/* Top open opportunities */}
      <SectionHeading>Top open opportunities</SectionHeading>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-titanium">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-titanium text-xs text-nova-ink-faint">
              <th className="px-4 py-2 font-medium">Account</th>
              <th className="px-4 py-2 font-medium">Package</th>
              <th className="px-4 py-2 font-medium">Stage</th>
              <th className="px-4 py-2 font-medium">Expected value</th>
              <th className="px-4 py-2 font-medium">Next action</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {position.topOpenOpportunities.map((o) => (
              <tr key={o.id} className="border-b border-titanium last:border-b-0">
                <td className="px-4 py-2 text-nova-ink">{o.accountName}</td>
                <td className="px-4 py-2 text-nova-ink-muted">{COMMERCIAL_PACKAGES[o.commercialPackage].name}</td>
                <td className="px-4 py-2 text-nova-ink-muted">{OPPORTUNITY_STAGE_LABELS[o.stage]}</td>
                <td className="px-4 py-2 text-nova-ink-muted">{formatChf(o.expectedTcvChf ?? o.expectedAcvChf ?? 0)}</td>
                <td className="px-4 py-2 text-nova-ink-muted">{o.nextAction ?? "—"}</td>
                <td className="px-4 py-2">
                  <Link href={`/app/commercial/opportunities/${o.id}`} className="text-nova-accent hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {position.topOpenOpportunities.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-nova-ink-faint">
                  No open opportunities yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pipeline hygiene */}
      <SectionHeading>Pipeline hygiene</SectionHeading>
      {position.opportunitiesWithHygieneIssues.length === 0 ? (
        <p className="mt-3 text-sm text-nova-ink-muted">No open opportunity has an outstanding hygiene issue.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {position.opportunitiesWithHygieneIssues.map(({ opportunity, hygieneIssues }) => (
            <div key={opportunity.id} className="rounded-xl border border-nova-warning/30 bg-carbon p-3 text-sm">
              <div className="flex items-center justify-between">
                <Link href={`/app/commercial/opportunities/${opportunity.id}`} className="font-medium text-nova-ink hover:underline">
                  {opportunity.accountName}
                </Link>
                <span className="text-xs text-nova-ink-faint">{OPPORTUNITY_STAGE_LABELS[opportunity.stage]}</span>
              </div>
              <ul className="mt-1 list-inside list-disc text-xs text-nova-warning">
                {hygieneIssues.map((issue) => (
                  <li key={issue}>{HYGIENE_ISSUE_LABELS[issue]}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Next actions due */}
      <SectionHeading>Next actions due within 7 days</SectionHeading>
      {position.nextActionsDueSoon.length === 0 ? (
        <p className="mt-3 text-sm text-nova-ink-muted">Nothing due in the next 7 days.</p>
      ) : (
        <ul className="mt-3 space-y-1 text-sm">
          {position.nextActionsDueSoon.map((o) => (
            <li key={o.id} className="flex justify-between rounded-lg border border-titanium bg-carbon px-3 py-2">
              <span className="text-nova-ink">
                {o.accountName} — {o.nextAction}
              </span>
              <span className="text-nova-ink-faint">{o.nextActionDueAt}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Conversion funnel */}
      <SectionHeading>Conversion funnel</SectionHeading>
      {funnel.insufficientData ? (
        <p className="mt-3 text-sm text-nova-ink-muted">Insufficient data — no opportunities recorded yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-titanium">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-titanium text-xs text-nova-ink-faint">
                <th className="px-4 py-2 font-medium">Stage</th>
                <th className="px-4 py-2 font-medium">Count</th>
                <th className="px-4 py-2 font-medium">Conversion from previous</th>
              </tr>
            </thead>
            <tbody>
              {funnel.stages.map((s) => (
                <tr key={s.stage} className="border-b border-titanium last:border-b-0">
                  <td className="px-4 py-2 text-nova-ink">{FUNNEL_STAGE_LABELS[s.stage]}</td>
                  <td className="px-4 py-2 text-nova-ink-muted">{s.count}</td>
                  <td className="px-4 py-2 text-nova-ink-muted">{s.conversionRateFromPrevious === null ? "—" : `${(s.conversionRateFromPrevious * 100).toFixed(0)}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sales velocity */}
      <SectionHeading>Sales velocity</SectionHeading>
      <div className="mt-3 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Inquiry → Qualified" value={formatDays(velocity.inquiryToQualified.averageDays)} />
        <MetricCard label="Qualified → Proposal" value={formatDays(velocity.qualifiedToProposal.averageDays)} />
        <MetricCard label="Proposal → Signed" value={formatDays(velocity.proposalToSigned.averageDays)} />
        <MetricCard label="Signed → Sprint start" value={formatDays(velocity.signedToSprintStart.averageDays)} />
        <MetricCard label="Sprint start → Completion" value={formatDays(velocity.sprintStartToCompletion.averageDays)} />
        <MetricCard label="Completion → Expansion" value={formatDays(velocity.completionToExpansion.averageDays)} />
      </div>

      {/* Scenario planning */}
      <SectionHeading>First CHF 1M path — scenario planning</SectionHeading>
      <p className="mt-2 text-sm text-nova-ink-muted">A possible path to close the gap, not a forecast — three named scenarios, deterministic arithmetic only.</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        <ScenarioCard label="Downside" scenario={downsideScenario} />
        <ScenarioCard label="Base" scenario={baseScenario} />
        <ScenarioCard label="Upside" scenario={upsideScenario} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-nova-ink-faint">{label}</p>
      <p className={`mt-1 font-mono text-lg tabular-nums ${accent ? "text-nova-success" : "text-nova-ink"}`}>{value}</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">{children}</h2>;
}

function ScenarioCard({ label, scenario }: { label: string; scenario: ReturnType<typeof computeScenario> }) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-4">
      <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">{label}</p>
      <p className="mt-2 font-mono text-xl tabular-nums text-nova-ink">{formatChf(scenario.totalBookingsChf)}</p>
      <p className="mt-1 text-xs text-nova-ink-muted">
        {scenario.numberOfSprints} sprints · ~{scenario.impliedTeamCount.toFixed(1)} teams · {scenario.enterpriseWins} enterprise
      </p>
      <p className="mt-1 text-xs text-nova-ink-faint">ARR: {formatChf(scenario.totalArrChf)}</p>
    </div>
  );
}

function RestrictedNotice({ reason }: { reason: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Commercial</h1>
      <p className="mt-4 text-sm text-nova-ink-muted">{reason}</p>
    </div>
  );
}
