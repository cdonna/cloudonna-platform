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
import { classifyVersionEvent } from "@/components/donna-ai/engine/decision-events";
import type { DecisionInput } from "@/components/donna-ai/intelligence/types";
import { listConflictsForDecision, listResearchEvidenceForDecision } from "@/components/donna-ai/research/persistence/research-repository";
import { listDecisionImpacts } from "@/components/donna-ai/vendor-intelligence/evidence-graph/persistence/vendor-knowledge-repository";
import { listStakeholdersForDecision } from "@/components/donna-ai/workspace/stakeholders-repository";
import { listActionItemsForDecision } from "@/components/donna-ai/workspace/action-items-repository";
import { getDecisionOutcome, getBusinessCaseActuals, listAssumptionValidations } from "@/lib/decision-outcomes/repository";
import { DecisionWorkspace } from "@/components/donna-ai/workspace/ui/DecisionWorkspace";
import { PageLoadError } from "@/components/ui/page-load-error";

export default async function DecisionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string | string[]; compare?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  try {
    return await renderDecisionDetail(id, sp);
  } catch (error) {
    console.error("[app/decisions/[id]] page_load_failed:", error instanceof Error ? error.message : error);
    return (
      <div>
        <Link href="/app/decisions" className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition duration-200 hover:text-nova-ink">
          <ArrowLeft size={15} />
          Back to decision history
        </Link>
        <div className="mt-6">
          <PageLoadError />
        </div>
      </div>
    );
  }
}

async function renderDecisionDetail(id: string, sp: { version?: string | string[]; compare?: string | string[] }) {
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

  const [versionsResult, researchEvidenceResult, researchConflictsResult, decisionImpactsResult, stakeholdersResult, actionItemsResult, outcomeResult, actualsResult, assumptionsResult] =
    await Promise.all([
      listDecisionVersions(supabase, id),
      listResearchEvidenceForDecision(supabase, id),
      listConflictsForDecision(supabase, id),
      listDecisionImpacts(supabase, id),
      listStakeholdersForDecision(supabase, id),
      listActionItemsForDecision(supabase, id),
      getDecisionOutcome(supabase, id),
      getBusinessCaseActuals(supabase, id),
      listAssumptionValidations(supabase, id),
    ]);

  const versions = versionsResult.ok ? versionsResult.data : [];
  const researchEvidence = researchEvidenceResult.ok ? researchEvidenceResult.data : [];
  const researchConflicts = researchConflictsResult.ok ? researchConflictsResult.data : [];
  const decisionImpacts = decisionImpactsResult.ok ? decisionImpactsResult.data : [];
  const stakeholders = stakeholdersResult.ok ? stakeholdersResult.data : [];
  const actionItems = actionItemsResult.ok ? actionItemsResult.data : [];
  const outcome = outcomeResult.ok ? outcomeResult.data : null;
  const actuals = actualsResult.ok ? actualsResult.data : null;
  const assumptions = assumptionsResult.ok ? assumptionsResult.data : [];

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
  let diffEvents: ReturnType<typeof classifyVersionEvent> = [];
  if (plan.compareVersionNumber !== null) {
    const compareResult = await getDecisionVersionByNumber(supabase, id, plan.compareVersionNumber);
    if (compareResult.ok) {
      diffSection = buildOrderedComparison(toVersionSnapshot(displayedContent), toVersionSnapshot(compareResult.data));
      // classifyVersionEvent describes the NEWER (toVersion) side of the
      // diff — whichever of the two fetched versions that actually is,
      // since buildOrderedComparison itself re-orders older/newer
      // regardless of which side the caller passed first.
      const newerContent = displayedContent.versionNumber === diffSection.diff.toVersion ? displayedContent : compareResult.data;
      const newerScenarioOverrides = (newerContent.decisionInput as DecisionInput)?.scenarioOverrides;
      diffEvents = classifyVersionEvent(diffSection.diff, newerContent.humanOverride, Boolean(newerScenarioOverrides && Object.keys(newerScenarioOverrides).length > 0));
    }
  }

  const report = toDecisionReport(displayedContent);
  const decisionInput = toVersionSnapshot(displayedContent).decisionInput;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/app/decisions" className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition duration-200 hover:text-nova-ink">
          <ArrowLeft size={15} />
          Back to decision history
        </Link>
        {/* Only offered while viewing the current version — appending
            from a historical view would silently create a new version
            from stale content, which is confusing rather than useful. */}
        {!isHistorical && <AppendVersionAction decisionId={id} decisionInput={decisionInput} report={report} />}
      </div>

      {isHistorical && (
        <div role="status" className="mt-4 rounded-xl border border-nova-warning/30 bg-nova-warning/10 px-4 py-3 text-sm text-nova-warning">
          You&apos;re viewing historical version {displayedContent.versionNumber}, saved {new Date(displayedContent.generatedAt).toLocaleString()}. This is
          the stored content exactly as it was saved — nothing was recomputed.{" "}
          <Link href={`/app/decisions/${id}?version=${currentVersionNumber}`} className="font-medium underline underline-offset-2">
            Return to current (v{currentVersionNumber})
          </Link>
        </div>
      )}

      <div className="mt-4">
        <DecisionWorkspace
          decisionId={id}
          title={result.data.title}
          humanReadableId={result.data.humanReadableId}
          decisionStatus={result.data.status}
          organizationName={null}
          ownerEmail={displayedContent.createdByEmail ?? null}
          lastUpdatedAt={displayedContent.generatedAt}
          decisionInput={decisionInput}
          output={report.output}
          humanOverride={displayedContent.humanOverride}
          editable={!isHistorical}
          researchEvidence={researchEvidence}
          researchConflicts={researchConflicts}
          decisionImpacts={decisionImpacts}
          stakeholders={stakeholders}
          actionItems={actionItems}
          versions={versions}
          currentVersionNumber={currentVersionNumber}
          displayedVersionNumber={displayedContent.versionNumber}
          diff={diffSection?.diff ?? null}
          diffExplanation={diffSection?.explanation ?? null}
          diffEvents={diffEvents}
          outcome={outcome}
          actuals={actuals}
          assumptions={assumptions}
        />
      </div>
    </div>
  );
}
