import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDecisionDetail, getDecisionVersionByNumber, listDecisionVersions } from "@/components/donna-ai/persistence/decisions-repository";
import {
  buildOrderedComparison,
  isHistoricalVersionView,
  parseVersionParam,
  resolveDecisionViewPlan,
  toDecisionReport,
  toVersionSnapshot,
  type VersionComparison,
} from "@/components/donna-ai/persistence/decision-view-resolver";
import { AppendVersionAction } from "@/components/donna-ai/persistence/AppendVersionAction";
import { DecisionTimeline } from "@/components/donna-ai/persistence/DecisionTimeline";
import { VersionControls } from "@/components/donna-ai/persistence/VersionControls";
import { VersionDiffPanel } from "@/components/donna-ai/persistence/VersionDiffPanel";
import { OverviewTab } from "@/components/donna-ai/ResultPanel/OverviewTab";
import { IntelligenceTab } from "@/components/donna-ai/ResultPanel/IntelligenceTab";
import { SectionLabel } from "@/components/donna-ai/shared";

export default async function DecisionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string | string[]; compare?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const result = await getDecisionDetail(supabase, id);

  if (!result.ok) {
    return (
      <div>
        <Link href="/app/decisions" className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition duration-200 hover:text-nova-ink">
          <ArrowLeft size={15} />
          Back to decision history
        </Link>
        <p role="alert" className="mt-6 text-sm text-red-400">
          {result.reason}
        </p>
      </div>
    );
  }

  const currentVersionNumber = result.data.version.versionNumber;
  const versionsResult = await listDecisionVersions(supabase, id);
  const versions = versionsResult.ok ? versionsResult.data : [];

  // All decision-making about what to fetch and display lives in the
  // pure resolver (decision-view-resolver.ts) — this page only follows
  // the plan it returns. See docs/capabilities/decision-memory.md,
  // "Slice A."
  const plan = resolveDecisionViewPlan({
    requestedVersion: parseVersionParam(sp.version),
    compareVersion: parseVersionParam(sp.compare),
    knownVersionNumbers: versions.map((v) => v.versionNumber),
    currentVersionNumber,
  });

  let displayedContent = result.data.version;
  if (plan.needsDisplayFetch) {
    const versionResult = await getDecisionVersionByNumber(supabase, id, plan.displayedVersionNumber);
    if (versionResult.ok) {
      displayedContent = versionResult.data;
    }
  }
  const isHistorical = isHistoricalVersionView(displayedContent.versionNumber, currentVersionNumber);

  let diffSection: VersionComparison | null = null;
  if (plan.compareVersionNumber !== null) {
    const compareResult = await getDecisionVersionByNumber(supabase, id, plan.compareVersionNumber);
    if (compareResult.ok) {
      diffSection = buildOrderedComparison(toVersionSnapshot(displayedContent), toVersionSnapshot(compareResult.data));
    }
  }

  const report = toDecisionReport(displayedContent);

  return (
    <div>
      <Link href="/app/decisions" className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition duration-200 hover:text-nova-ink">
        <ArrowLeft size={15} />
        Back to decision history
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">{result.data.title}</h1>
          <p className="mt-1 font-mono text-xs text-nova-ink-faint">{result.data.humanReadableId}</p>
        </div>
        <span className="inline-flex rounded-full border border-nova-success/30 bg-nova-success/10 px-3 py-1 text-xs font-medium text-nova-success">
          {result.data.status}
        </span>
      </div>

      {/* Only offered while viewing the current version — appending
          from a historical view would silently create a new version
          from stale content, which is confusing rather than useful.
          Slice A's own resolution logic already tells us which case
          we're in via isHistorical. */}
      {!isHistorical && (
        <div className="mt-4">
          <AppendVersionAction decisionId={id} decisionInput={toVersionSnapshot(displayedContent).decisionInput} report={report} />
        </div>
      )}

      {isHistorical && (
        <div role="status" className="mt-4 rounded-xl border border-nova-warning/30 bg-nova-warning/10 px-4 py-3 text-sm text-nova-warning">
          You&apos;re viewing historical version {displayedContent.versionNumber}, saved {new Date(displayedContent.generatedAt).toLocaleString()}.
          This is the stored content exactly as it was saved — nothing was recomputed.{" "}
          <Link href={`/app/decisions/${id}?version=${currentVersionNumber}`} className="font-medium underline underline-offset-2">
            Return to current (v{currentVersionNumber})
          </Link>
        </div>
      )}

      {versions.length > 0 && (
        <div className="mt-6 grid gap-4">
          {versions.length > 1 && (
            <VersionControls decisionId={id} versions={versions} displayedVersionNumber={displayedContent.versionNumber} />
          )}
          <DecisionTimeline
            decisionId={id}
            versions={versions}
            currentVersionNumber={currentVersionNumber}
            displayedVersionNumber={displayedContent.versionNumber}
          />
        </div>
      )}

      {diffSection && (
        <div className="mt-6">
          <VersionDiffPanel diff={diffSection.diff} explanation={diffSection.explanation} />
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-titanium bg-carbon p-5">
        <SectionLabel>Version metadata</SectionLabel>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-nova-ink-faint">Version</dt>
            <dd className="tabular-nums text-nova-ink">v{displayedContent.versionNumber}</dd>
          </div>
          <div>
            <dt className="text-xs text-nova-ink-faint">Generated</dt>
            <dd className="text-nova-ink">{new Date(displayedContent.generatedAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-nova-ink-faint">Created by</dt>
            <dd className="text-nova-ink">{displayedContent.createdByEmail ?? "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-xs text-nova-ink-faint">Saved</dt>
            <dd className="text-nova-ink">{new Date(displayedContent.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-nova-ink-faint">Schema version</dt>
            <dd className="font-mono text-xs text-nova-ink-muted">{displayedContent.schemaVersion}</dd>
          </div>
          <div>
            <dt className="text-xs text-nova-ink-faint">Scoring engine</dt>
            <dd className="font-mono text-xs text-nova-ink-muted">{displayedContent.scoringEngineVersion}</dd>
          </div>
          <div>
            <dt className="text-xs text-nova-ink-faint">Knowledge base</dt>
            <dd className="font-mono text-xs text-nova-ink-muted">{displayedContent.knowledgeBaseVersion}</dd>
          </div>
          <div>
            <dt className="text-xs text-nova-ink-faint">Provider</dt>
            <dd className="font-mono text-xs text-nova-ink-muted">{report.provider.providerId}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 grid gap-6">
        <div className="rounded-2xl border border-titanium bg-carbon p-6">
          <OverviewTab output={report.output} />
        </div>
        <div className="rounded-2xl border border-titanium bg-carbon p-6">
          <IntelligenceTab report={report} />
        </div>
      </div>
    </div>
  );
}
