import type { Metadata } from "next";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { listCommercialOpportunities } from "@/lib/commercial/repository";
import { computeCommercialDashboard } from "@/lib/commercial/dashboard-metrics";
import { FIRST_MILLION_TARGET_CHF } from "@/lib/commercial/target-model";
import { COMMERCIAL_PACKAGES, type CommercialPackageId } from "@/lib/commercial/packages";
import { OPPORTUNITY_STAGE_LABELS } from "@/lib/commercial/opportunity-stages";

export const metadata: Metadata = {
  title: "Commercial — ClouDonna",
};

function formatChf(value: number): string {
  return new Intl.NumberFormat("en-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
}

/**
 * Internal, platform-staff-only commercial dashboard (brief §15) —
 * same access pattern as /app/inquiries: checked by calling
 * is_platform_staff() directly, never trusted client-side. Not
 * public, never linked from any public page, and deliberately
 * executive-simple: target, bookings, ARR, pipeline, weighted
 * pipeline, coverage, open opportunities, and a per-package
 * breakdown — nothing else.
 */
export default async function CommercialDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return <RestrictedNotice reason="Sign in to view this page." />;

  const supabase = await createSupabaseServerClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return <RestrictedNotice reason="This area is restricted to ClouDonna platform staff." />;

  const result = await listCommercialOpportunities(supabase);
  const opportunities = result.ok ? result.data : [];

  const summary = computeCommercialDashboard(
    opportunities.map((o) => ({
      stage: o.stage,
      commercialPackage: o.commercialPackage,
      expectedAcvChf: o.expectedAcvChf,
      expectedTcvChf: o.expectedTcvChf,
      probabilityPercent: o.probabilityPercent,
    })),
    FIRST_MILLION_TARGET_CHF,
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Commercial</h1>
      <p className="mt-2 text-sm text-nova-ink-muted">
        First CHF 1M bookings — a planning scenario, not a forecast. Every number below is a real sum over
        {" "}{opportunities.length} opportunit{opportunities.length === 1 ? "y" : "ies"}, never a vanity metric.
      </p>

      {!result.ok && (
        <p role="alert" className="mt-6 text-sm text-red-400">
          {result.reason}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricCard label="Target" value={formatChf(summary.targetBookingsChf)} />
        <MetricCard label="Booked" value={formatChf(summary.bookedChf)} accent={summary.bookedChf > 0} />
        <MetricCard label="ARR (signed)" value={formatChf(summary.arrChf)} />
        <MetricCard label="Pipeline" value={formatChf(summary.pipeline.pipelineValueChf)} />
        <MetricCard label="Weighted pipeline" value={formatChf(summary.pipeline.weightedPipelineValueChf)} />
        <MetricCard
          label="Coverage"
          value={summary.pipeline.coverageRatio === null ? "—" : `${summary.pipeline.coverageRatio.toFixed(1)}x`}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-titanium bg-carbon p-5">
        <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Are we on track for CHF 1M?</p>
        <p className={`mt-2 text-sm font-medium ${summary.onTrackForTarget ? "text-nova-success" : "text-nova-warning"}`}>
          {summary.onTrackForTarget
            ? "Booked + weighted pipeline together reach the target."
            : `${formatChf(summary.pipeline.remainingToTargetChf)} still needed beyond booked + weighted pipeline.`}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(COMMERCIAL_PACKAGES) as CommercialPackageId[]).map((id) => (
          <div key={id} className="rounded-2xl border border-titanium bg-carbon p-4">
            <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">{COMMERCIAL_PACKAGES[id].name}</p>
            <p className="mt-2 text-sm text-nova-ink">{summary.byPackage[id].open} open</p>
            <p className="text-sm text-nova-ink-muted">{summary.byPackage[id].closedWon} closed won</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">Open opportunities</p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-titanium">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-titanium text-xs text-nova-ink-faint">
                <th className="px-4 py-2 font-medium">Account</th>
                <th className="px-4 py-2 font-medium">Package</th>
                <th className="px-4 py-2 font-medium">Stage</th>
                <th className="px-4 py-2 font-medium">Decision value</th>
                <th className="px-4 py-2 font-medium">Expected TCV</th>
                <th className="px-4 py-2 font-medium">Next action</th>
                <th className="px-4 py-2 font-medium">Linked decision</th>
              </tr>
            </thead>
            <tbody>
              {opportunities
                .filter((o) => o.stage !== "closed_won" && o.stage !== "closed_lost")
                .map((o) => (
                  <tr key={o.id} className="border-b border-titanium last:border-b-0">
                    <td className="px-4 py-2 text-nova-ink">{o.accountName}</td>
                    <td className="px-4 py-2 text-nova-ink-muted">{COMMERCIAL_PACKAGES[o.commercialPackage].name}</td>
                    <td className="px-4 py-2 text-nova-ink-muted">{OPPORTUNITY_STAGE_LABELS[o.stage]}</td>
                    <td className="px-4 py-2 text-nova-ink-muted">{o.decisionValueChf ? formatChf(o.decisionValueChf) : "—"}</td>
                    <td className="px-4 py-2 text-nova-ink-muted">{o.expectedTcvChf ? formatChf(o.expectedTcvChf) : "—"}</td>
                    <td className="px-4 py-2 text-nova-ink-muted">{o.nextAction ?? "—"}</td>
                    <td className="px-4 py-2 text-nova-ink-muted">{o.decisionTitle ?? "—"}</td>
                  </tr>
                ))}
              {opportunities.filter((o) => o.stage !== "closed_won" && o.stage !== "closed_lost").length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-nova-ink-faint">
                    No open opportunities yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

function RestrictedNotice({ reason }: { reason: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Commercial</h1>
      <p className="mt-4 text-sm text-nova-ink-muted">{reason}</p>
    </div>
  );
}
