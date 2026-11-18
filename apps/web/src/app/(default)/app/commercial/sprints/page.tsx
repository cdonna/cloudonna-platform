import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { listDecisionSprints } from "@/lib/commercial/sprints-repository";
import { listCommercialAccounts } from "@/lib/commercial/repository";
import { DECISION_SPRINT_STATUS_LABELS } from "@/lib/commercial/decision-sprint-status";
import { CreateSprintForm } from "./CreateSprintForm";

export const metadata: Metadata = { title: "Decision Sprints — ClouDonna" };

/** Decision Sprint delivery list (brief §13/§37) — platform-staff only. */
export default async function DecisionSprintsPage() {
  const user = await getCurrentUser();
  if (!user) return <Restricted reason="Sign in to view this page." />;

  const supabase = await createSupabaseServerClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return <Restricted reason="This area is restricted to ClouDonna platform staff." />;

  const [sprintsResult, accountsResult] = await Promise.all([listDecisionSprints(supabase), listCommercialAccounts(supabase)]);
  const sprints = sprintsResult.ok ? sprintsResult.data : [];
  const accounts = accountsResult.ok ? accountsResult.data : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Decision Sprints</h1>
          <p className="mt-2 text-sm text-nova-ink-muted">Every Decision Sprint delivery engagement, scoping through completion.</p>
        </div>
        <CreateSprintForm accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} />
      </div>

      <div className="mt-8 space-y-2">
        {sprints.map((s) => (
          <Link key={s.id} href={`/app/commercial/sprints/${s.id}`} className="block rounded-xl border border-titanium bg-carbon px-4 py-3 text-sm transition-colors hover:bg-carbon-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-nova-ink">{s.accountName}</span>
              <span className="text-nova-ink-faint">{DECISION_SPRINT_STATUS_LABELS[s.status]}</span>
            </div>
            {s.scope && <p className="mt-1 text-xs text-nova-ink-muted">{s.scope}</p>}
          </Link>
        ))}
        {sprints.length === 0 && (
          <div className="rounded-2xl border border-dashed border-titanium bg-carbon p-10 text-center">
            <p className="text-sm text-nova-ink-muted">No Decision Sprints yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Restricted({ reason }: { reason: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Decision Sprints</h1>
      <p className="mt-4 text-sm text-nova-ink-muted">{reason}</p>
    </div>
  );
}
