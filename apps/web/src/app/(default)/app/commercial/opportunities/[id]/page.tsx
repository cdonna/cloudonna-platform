import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { getCommercialOpportunity } from "@/lib/commercial/repository";
import { getContractForOpportunity } from "@/lib/commercial/contracts-repository";
import { listInvoicesForContract } from "@/lib/commercial/invoices-repository";
import { listActivitiesForOpportunity } from "@/lib/commercial/activities-repository";
import { COMMERCIAL_PACKAGES } from "@/lib/commercial/packages";
import { OPPORTUNITY_STAGE_LABELS } from "@/lib/commercial/opportunity-stages";
import { UpdateOpportunityForm } from "./UpdateOpportunityForm";
import { ContractForm } from "./ContractForm";
import { InvoicesPanel } from "./InvoicesPanel";

export const metadata: Metadata = { title: "Opportunity — ClouDonna" };

function formatChf(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-CH", { style: "currency", currency: "CHF", maximumFractionDigits: 0 }).format(value);
}

/** Opportunity Admin (brief §37) — create account/opportunity happens
 * from the account page; this page edits one opportunity: stage,
 * values, forecast category, next action, close date, won/lost
 * reason, contract terms, invoices. Platform-staff only. */
export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return <Restricted reason="Sign in to view this page." />;

  const supabase = await createSupabaseServerClient();
  const { data: isStaff } = await supabase.rpc("is_platform_staff");
  if (!isStaff) return <Restricted reason="This area is restricted to ClouDonna platform staff." />;

  const opportunityResult = await getCommercialOpportunity(supabase, id);
  if (!opportunityResult.ok) return <Restricted reason={opportunityResult.reason} />;
  const opportunity = opportunityResult.data;

  const [contractResult, activitiesResult] = await Promise.all([getContractForOpportunity(supabase, id), listActivitiesForOpportunity(supabase, id)]);
  const contract = contractResult.ok ? contractResult.data : null;
  const activities = activitiesResult.ok ? activitiesResult.data : [];

  const invoicesResult = contract ? await listInvoicesForContract(supabase, contract.id) : null;
  const invoices = invoicesResult?.ok ? invoicesResult.data : [];

  return (
    <div>
      <Link href={`/app/commercial/accounts/${opportunity.accountId}`} className="text-xs text-nova-ink-faint hover:text-nova-ink">
        ← {opportunity.accountName}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-nova-ink">
        {COMMERCIAL_PACKAGES[opportunity.commercialPackage].name} — {opportunity.accountName}
      </h1>
      <p className="mt-2 text-sm text-nova-ink-muted">{OPPORTUNITY_STAGE_LABELS[opportunity.stage]}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard label="Decision value" value={formatChf(opportunity.decisionValueChf)} />
        <MetricCard label="Expected bookings" value={formatChf(opportunity.expectedBookingsChf)} />
        <MetricCard label="Expected ARR" value={formatChf(opportunity.expectedArrChf)} />
        <MetricCard label="Expected TCV" value={formatChf(opportunity.expectedTcvChf)} />
        <MetricCard label="Linked decision" value={opportunity.linkedDecisionTitle ?? "None"} />
      </div>

      <SectionHeading>Opportunity details</SectionHeading>
      <UpdateOpportunityForm
        opportunityId={opportunity.id}
        initial={{
          stage: opportunity.stage,
          nextAction: opportunity.nextAction,
          nextActionDueAt: opportunity.nextActionDueAt,
          targetCloseDate: opportunity.targetCloseDate,
          decisionTitle: opportunity.decisionTitle,
          decisionDeadline: opportunity.decisionDeadline,
          expectedBookingsChf: opportunity.expectedBookingsChf,
          expectedArrChf: opportunity.expectedArrChf,
          expectedTcvChf: opportunity.expectedTcvChf,
          forecastCategory: opportunity.forecastCategory,
        }}
      />

      <SectionHeading>Contract</SectionHeading>
      <ContractForm
        opportunityId={opportunity.id}
        initial={
          contract
            ? {
                oneTimeFee: contract.oneTimeFee,
                servicesFee: contract.servicesFee,
                recurringAnnualFee: contract.recurringAnnualFee,
                discountPercent: contract.discountPercent,
                termMonths: contract.termMonths,
                contractStart: contract.contractStart,
                contractEnd: contract.contractEnd,
                billingFrequency: contract.billingFrequency,
                currency: contract.currency,
                contractStatus: contract.contractStatus,
                computedBookingsChf: contract.computedBookingsChf,
                computedArrChf: contract.computedArrChf,
                computedTcvChf: contract.computedTcvChf,
              }
            : null
        }
      />

      {contract && (
        <>
          <SectionHeading>Invoices / cash collection</SectionHeading>
          <InvoicesPanel
            opportunityId={opportunity.id}
            contractId={contract.id}
            invoices={invoices.map((i) => ({ id: i.id, invoiceAmount: i.invoiceAmount, currency: i.currency, paidAmount: i.paidAmount, paymentStatus: i.paymentStatus, dueDate: i.dueDate }))}
          />
        </>
      )}

      <SectionHeading>Activity</SectionHeading>
      <div className="mt-3 space-y-2">
        {activities.map((a) => (
          <div key={a.id} className="rounded-xl border border-titanium bg-carbon px-4 py-3 text-xs text-nova-ink-muted">
            <span className="text-nova-ink">{a.activityType}</span>
            <span className="ml-2 text-nova-ink-faint">{new Date(a.createdAt).toLocaleString()}</span>
            {a.note && <p className="mt-1">{a.note}</p>}
          </div>
        ))}
        {activities.length === 0 && <p className="text-sm text-nova-ink-faint">No activity logged yet.</p>}
      </div>
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
      <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Opportunity</h1>
      <p className="mt-4 text-sm text-nova-ink-muted">{reason}</p>
    </div>
  );
}
