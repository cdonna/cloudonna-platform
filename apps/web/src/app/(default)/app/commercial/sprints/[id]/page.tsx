import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { getDecisionSprint, getSprintOutcome } from "@/lib/commercial/sprints-repository";
import { DECISION_SPRINT_STATUS_LABELS } from "@/lib/commercial/decision-sprint-status";
import { SprintStatusForm } from "./SprintStatusForm";
import { OutcomeForm } from "./OutcomeForm";
import { ConversionForm } from "./ConversionForm";

export const metadata: Metadata = { title: "Decision Sprint — ClouDonna" };

/** Decision Sprint detail (brief §13/§14) — status, scope, outcome
 * capture, conversion recording. Platform-staff only. */
export default async function SprintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return <Restricted reason="Sign in to view this page." />;

  const supabase = await createSupabaseServerClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return <Restricted reason="This area is restricted to ClouDonna platform staff." />;

  const sprintResult = await getDecisionSprint(supabase, id);
  if (!sprintResult.ok) return <Restricted reason={sprintResult.reason} />;
  const sprint = sprintResult.data;

  const outcomeResult = await getSprintOutcome(supabase, id);
  const outcome = outcomeResult.ok ? outcomeResult.data : null;

  return (
    <div>
      <Link href={`/app/commercial/accounts/${sprint.accountId}`} className="text-xs text-nova-ink-faint hover:text-nova-ink">
        ← {sprint.accountName}
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">{sprint.scope ?? "Decision Sprint"}</h1>
        <SprintStatusForm sprintId={sprint.id} initialStatus={sprint.status} />
      </div>
      <p className="mt-2 text-sm text-nova-ink-muted">{DECISION_SPRINT_STATUS_LABELS[sprint.status]}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Start date" value={sprint.startDate ?? "—"} />
        <MetricCard label="Target completion" value={sprint.targetCompletionDate ?? "—"} />
        <MetricCard label="Commercial value" value={sprint.commercialValueChf ? `CHF ${sprint.commercialValueChf}` : "—"} />
      </div>

      <SectionHeading>Outcome</SectionHeading>
      <OutcomeForm sprintId={sprint.id} initial={outcome} />

      <SectionHeading>Sprint → Team / Enterprise conversion</SectionHeading>
      <ConversionForm accountId={sprint.accountId} sprintId={sprint.id} />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-nova-ink-faint">{label}</p>
      <p className="mt-1 text-sm text-nova-ink">{value}</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">{children}</h2>;
}

function Restricted({ reason }: { reason: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Decision Sprint</h1>
      <p className="mt-4 text-sm text-nova-ink-muted">{reason}</p>
    </div>
  );
}
