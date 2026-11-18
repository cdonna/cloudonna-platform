import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { getCommercialAccount, listCommercialOpportunitiesForAccount, type CommercialOpportunitySummary } from "@/lib/commercial/repository";
import { listContactsForAccount, countExecutiveStakeholders } from "@/lib/commercial/contacts-repository";
import { listDecisionSprintsForAccount } from "@/lib/commercial/sprints-repository";
import { listConversionsForAccount } from "@/lib/commercial/conversions-repository";
import { getCustomerReference } from "@/lib/commercial/customer-references-repository";
import { listAllContracts } from "@/lib/commercial/contracts-repository";
import { ACCOUNT_STATUS_LABELS } from "@/lib/commercial/account-status";
import { COMMERCIAL_PACKAGES } from "@/lib/commercial/packages";
import { OPPORTUNITY_STAGE_LABELS, CLOSED_STAGES } from "@/lib/commercial/opportunity-stages";
import { BUYER_PERSONA_LABELS } from "@/lib/commercial/buyer-persona";
import { DECISION_SPRINT_STATUS_LABELS } from "@/lib/commercial/decision-sprint-status";
import { CONVERSION_TYPE_LABELS } from "@/lib/commercial/conversion-type";
import { computeExpansionSignals, EXPANSION_SIGNAL_LABELS } from "@/lib/commercial/expansion-signals";
import { AccountStatusForm } from "./AccountStatusForm";
import { AddContactForm } from "./AddContactForm";
import { CreateOpportunityForm } from "./CreateOpportunityForm";
import { CustomerReferenceForm } from "./CustomerReferenceForm";

export const metadata: Metadata = { title: "Account — ClouDonna" };

function formatChf(value: number): string {
  return new Intl.NumberFormat("en-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
}

/** Internal account view (brief §38) — summary, contacts, open/closed
 * opportunities, signed contracts, Decision Sprints, bookings/ARR/TCV,
 * expansion potential, next action. Platform-staff only. */
export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return <Restricted reason="Sign in to view this page." />;

  const supabase = await createSupabaseServerClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return <Restricted reason="This area is restricted to ClouDonna platform staff." />;

  const [accountResult, opportunitiesResult, contactsResult, sprintsResult, conversionsResult, referenceResult, contractsResult, executiveStakeholderCount] = await Promise.all([
    getCommercialAccount(supabase, id),
    listCommercialOpportunitiesForAccount(supabase, id),
    listContactsForAccount(supabase, id),
    listDecisionSprintsForAccount(supabase, id),
    listConversionsForAccount(supabase, id),
    getCustomerReference(supabase, id),
    listAllContracts(supabase),
    countExecutiveStakeholders(supabase, id),
  ]);

  if (!accountResult.ok) return <Restricted reason={accountResult.reason} />;

  const account = accountResult.data;
  const opportunities = opportunitiesResult.ok ? opportunitiesResult.data : [];
  const contacts = contactsResult.ok ? contactsResult.data : [];
  const sprints = sprintsResult.ok ? sprintsResult.data : [];
  const conversions = conversionsResult.ok ? conversionsResult.data : [];
  const reference = referenceResult.ok ? referenceResult.data : null;
  const contracts = (contractsResult.ok ? contractsResult.data : []).filter((c) => opportunities.some((o) => o.id === c.opportunityId));

  const openOpportunities = opportunities.filter((o) => !CLOSED_STAGES.includes(o.stage));
  const closedOpportunities = opportunities.filter((o) => CLOSED_STAGES.includes(o.stage));
  const signedContracts = contracts.filter((c) => c.contractStatus === "signed" || c.contractStatus === "active");

  const bookedChf = signedContracts.reduce((sum, c) => sum + (c.computedBookingsChf ?? 0), 0);
  const arrChf = signedContracts.reduce((sum, c) => sum + (c.computedArrChf ?? 0), 0);
  const tcvChf = signedContracts.reduce((sum, c) => sum + (c.computedTcvChf ?? 0), 0);

  const distinctDecisionIds = new Set([...opportunities.map((o) => o.decisionId), ...sprints.map((s) => s.decisionId)].filter((v): v is string => v !== null));
  const completedSprintCount = sprints.filter((s) => s.status === "completed").length;
  const expansionSignals = computeExpansionSignals({
    accountId: id,
    distinctDecisionCount: distinctDecisionIds.size,
    executiveStakeholderCount,
    completedSprintCount,
  });

  const nextAction = openOpportunities.find((o) => o.nextAction)?.nextAction ?? null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">{account.name}</h1>
          <p className="mt-2 text-sm text-nova-ink-muted">
            {account.industry ?? "—"} · {account.country ?? "—"}
          </p>
        </div>
        <AccountStatusForm accountId={account.id} initialStatus={account.status} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Status" value={ACCOUNT_STATUS_LABELS[account.status]} />
        <MetricCard label="Bookings (signed)" value={formatChf(bookedChf)} accent={bookedChf > 0} />
        <MetricCard label="ARR" value={formatChf(arrChf)} />
        <MetricCard label="TCV" value={formatChf(tcvChf)} />
        <MetricCard label="Next action" value={nextAction ?? "None set"} />
      </div>

      {expansionSignals.recommendExpansionReview && (
        <div className="mt-6 rounded-2xl border border-nova-accent/30 bg-carbon p-4">
          <p className="text-xs font-semibold tracking-wide text-nova-accent uppercase">Expansion review recommended</p>
          <ul className="mt-2 list-inside list-disc text-sm text-nova-ink-muted">
            {expansionSignals.signals.map((s) => (
              <li key={s}>{EXPANSION_SIGNAL_LABELS[s]}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-nova-ink-faint">A computed signal for human review — nothing is created automatically. Record an outcome via a Decision Sprint&apos;s conversion.</p>
        </div>
      )}

      {/* Contacts */}
      <SectionHeading>Contacts</SectionHeading>
      <div className="mt-3 space-y-2">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-titanium bg-carbon px-4 py-3 text-sm">
            <div>
              <span className="font-medium text-nova-ink">{c.name}</span>
              {c.role && <span className="ml-2 text-nova-ink-faint">{c.role}</span>}
              {c.buyerPersona && <span className="ml-2 text-xs text-nova-accent">{BUYER_PERSONA_LABELS[c.buyerPersona]}</span>}
              <div className="mt-1 flex gap-2 text-xs text-nova-ink-faint">
                {c.economicBuyer && <span>Economic buyer</span>}
                {c.decisionMaker && <span>Decision maker</span>}
                {c.champion && <span>Champion</span>}
              </div>
            </div>
            <span className="text-nova-ink-muted">{c.email ?? "—"}</span>
          </div>
        ))}
        {contacts.length === 0 && <p className="text-sm text-nova-ink-faint">No contacts yet.</p>}
      </div>
      <div className="mt-2">
        <AddContactForm accountId={account.id} />
      </div>

      {/* Opportunities */}
      <SectionHeading>Open opportunities</SectionHeading>
      <OpportunityTable opportunities={openOpportunities} />
      <div className="mt-2">
        <CreateOpportunityForm accountId={account.id} contacts={contacts.map((c) => ({ id: c.id, name: c.name }))} />
      </div>

      <SectionHeading>Closed opportunities</SectionHeading>
      <OpportunityTable opportunities={closedOpportunities} />

      {/* Decision Sprints */}
      <SectionHeading>Decision Sprints</SectionHeading>
      <div className="mt-3 space-y-2">
        {sprints.map((s) => (
          <Link key={s.id} href={`/app/commercial/sprints/${s.id}`} className="block rounded-xl border border-titanium bg-carbon px-4 py-3 text-sm transition-colors hover:bg-carbon-2">
            <div className="flex items-center justify-between">
              <span className="text-nova-ink">{s.scope ?? "Untitled scope"}</span>
              <span className="text-nova-ink-faint">{DECISION_SPRINT_STATUS_LABELS[s.status]}</span>
            </div>
          </Link>
        ))}
        {sprints.length === 0 && <p className="text-sm text-nova-ink-faint">No Decision Sprints yet.</p>}
      </div>

      {/* Conversions */}
      <SectionHeading>Conversions</SectionHeading>
      <div className="mt-3 space-y-2">
        {conversions.map((c) => (
          <div key={c.id} className="rounded-xl border border-titanium bg-carbon px-4 py-3 text-sm">
            <span className="text-nova-ink">{CONVERSION_TYPE_LABELS[c.conversionType]}</span>
            {c.conversionValueChf && <span className="ml-2 text-nova-ink-muted">{formatChf(c.conversionValueChf)}</span>}
          </div>
        ))}
        {conversions.length === 0 && <p className="text-sm text-nova-ink-faint">No conversions recorded yet.</p>}
      </div>

      {/* Customer reference */}
      <SectionHeading>Customer reference permission</SectionHeading>
      <CustomerReferenceForm
        accountId={account.id}
        initial={{
          referenceStatus: reference?.referenceStatus ?? "private",
          allowAnonymousStats: reference?.allowAnonymousStats ?? false,
          allowPublicReference: reference?.allowPublicReference ?? false,
          allowLogoUse: reference?.allowLogoUse ?? false,
          allowCaseStudy: reference?.allowCaseStudy ?? false,
          allowQuote: reference?.allowQuote ?? false,
        }}
      />
    </div>
  );
}

function OpportunityTable({ opportunities }: { opportunities: CommercialOpportunitySummary[] }) {
  const rows = opportunities;
  if (rows.length === 0) return <p className="mt-3 text-sm text-nova-ink-faint">None.</p>;
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-titanium">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-titanium text-xs text-nova-ink-faint">
            <th className="px-4 py-2 font-medium">Package</th>
            <th className="px-4 py-2 font-medium">Stage</th>
            <th className="px-4 py-2 font-medium">Expected value</th>
            <th className="px-4 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-b border-titanium last:border-b-0">
              <td className="px-4 py-2 text-nova-ink">{COMMERCIAL_PACKAGES[o.commercialPackage].name}</td>
              <td className="px-4 py-2 text-nova-ink-muted">{OPPORTUNITY_STAGE_LABELS[o.stage]}</td>
              <td className="px-4 py-2 text-nova-ink-muted">{formatChf(o.expectedTcvChf ?? o.expectedAcvChf ?? 0)}</td>
              <td className="px-4 py-2">
                <Link href={`/app/commercial/opportunities/${o.id}`} className="text-nova-accent hover:underline">
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MetricCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-nova-ink-faint">{label}</p>
      <p className={`mt-1 text-sm ${accent ? "text-nova-success" : "text-nova-ink"}`}>{value}</p>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-10 text-xs font-semibold tracking-wide text-nova-ink-faint uppercase">{children}</h2>;
}

function Restricted({ reason }: { reason: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Account</h1>
      <p className="mt-4 text-sm text-nova-ink-muted">{reason}</p>
    </div>
  );
}
