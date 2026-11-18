"use server";

/**
 * Server actions behind the internal Revenue Operations / Commercial
 * Admin UI (brief §37-39). Each one just calls the already-built,
 * already-tested handle*Request function from lib/commercial —
 * staff-check and Zod validation live there, once, shared with the
 * public REST API routes under /api/commercial/*; this file adds no
 * business logic of its own, only the Next.js server-action wiring
 * and the revalidatePath() calls a REST route has no reason to make.
 */
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { handleCreateOpportunityRequest } from "@/lib/commercial/persistence/handle-create-opportunity-request";
import { handleUpdateOpportunityRequest } from "@/lib/commercial/persistence/handle-update-opportunity-request";
import { handleCreateAccountRequest } from "@/lib/commercial/persistence/handle-create-account-request";
import { handleUpdateAccountRequest } from "@/lib/commercial/persistence/handle-update-account-request";
import { handleCreateContactRequest } from "@/lib/commercial/persistence/handle-create-contact-request";
import { handleUpdateContactRequest } from "@/lib/commercial/persistence/handle-update-contact-request";
import { handleUpsertContractRequest } from "@/lib/commercial/persistence/handle-upsert-contract-request";
import { handleCreateInvoiceRequest } from "@/lib/commercial/persistence/handle-create-invoice-request";
import { handleUpdateInvoiceRequest } from "@/lib/commercial/persistence/handle-update-invoice-request";
import { handleCreateSprintRequest } from "@/lib/commercial/persistence/handle-create-sprint-request";
import { handleUpdateSprintRequest } from "@/lib/commercial/persistence/handle-update-sprint-request";
import { handleUpsertSprintOutcomeRequest } from "@/lib/commercial/persistence/handle-upsert-sprint-outcome-request";
import { handleCreateConversionRequest } from "@/lib/commercial/persistence/handle-create-conversion-request";
import { handleUpsertCustomerReferenceRequest } from "@/lib/commercial/persistence/handle-upsert-customer-reference-request";
import { handleCreateActivityRequest } from "@/lib/commercial/persistence/handle-create-activity-request";
import { handlePromoteInquiryRequest } from "@/lib/commercial/persistence/handle-promote-inquiry-request";

export interface ActionResult {
  error: string | null;
}

async function run(body: unknown, handler: (body: unknown, supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string | null) => Promise<{ status: number; body: unknown }>): Promise<ActionResult> {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const result = await handler(body, supabase, user?.id ?? null);
  if (result.status >= 400) {
    const errorBody = result.body as { error?: string };
    return { error: errorBody.error ?? "The request could not be processed." };
  }
  return { error: null };
}

export async function createAccountAction(body: unknown): Promise<ActionResult> {
  const result = await run(body, handleCreateAccountRequest);
  revalidatePath("/app/commercial/accounts");
  return result;
}

export async function updateAccountAction(accountId: string, body: unknown): Promise<ActionResult> {
  const result = await run(body, (b, s, u) => handleUpdateAccountRequest(accountId, b, s, u));
  revalidatePath(`/app/commercial/accounts/${accountId}`);
  revalidatePath("/app/commercial/accounts");
  return result;
}

export async function createContactAction(body: unknown): Promise<ActionResult> {
  const result = await run(body, handleCreateContactRequest);
  const accountId = (body as { accountId?: string }).accountId;
  if (accountId) revalidatePath(`/app/commercial/accounts/${accountId}`);
  return result;
}

export async function updateContactAction(contactId: string, accountId: string, body: unknown): Promise<ActionResult> {
  const result = await run(body, (b, s, u) => handleUpdateContactRequest(contactId, b, s, u));
  revalidatePath(`/app/commercial/accounts/${accountId}`);
  return result;
}

export async function createOpportunityAction(body: unknown): Promise<ActionResult> {
  const result = await run(body, handleCreateOpportunityRequest);
  revalidatePath("/app/commercial");
  const accountId = (body as { accountId?: string }).accountId;
  if (accountId) revalidatePath(`/app/commercial/accounts/${accountId}`);
  return result;
}

export async function updateOpportunityAction(opportunityId: string, body: unknown): Promise<ActionResult> {
  const result = await run(body, (b, s, u) => handleUpdateOpportunityRequest(opportunityId, b, s, u));
  revalidatePath(`/app/commercial/opportunities/${opportunityId}`);
  revalidatePath("/app/commercial");
  return result;
}

export async function upsertContractAction(opportunityId: string, body: unknown): Promise<ActionResult> {
  const result = await run(body, (b, s, u) => handleUpsertContractRequest(opportunityId, b, s, u));
  revalidatePath(`/app/commercial/opportunities/${opportunityId}`);
  revalidatePath("/app/commercial");
  return result;
}

export async function createInvoiceAction(opportunityId: string, body: unknown): Promise<ActionResult> {
  const result = await run(body, handleCreateInvoiceRequest);
  revalidatePath(`/app/commercial/opportunities/${opportunityId}`);
  return result;
}

export async function updateInvoiceAction(invoiceId: string, opportunityId: string, body: unknown): Promise<ActionResult> {
  const result = await run(body, (b, s, u) => handleUpdateInvoiceRequest(invoiceId, b, s, u));
  revalidatePath(`/app/commercial/opportunities/${opportunityId}`);
  return result;
}

export async function createSprintAction(body: unknown): Promise<ActionResult> {
  const result = await run(body, handleCreateSprintRequest);
  revalidatePath("/app/commercial/sprints");
  const accountId = (body as { accountId?: string }).accountId;
  if (accountId) revalidatePath(`/app/commercial/accounts/${accountId}`);
  return result;
}

export async function updateSprintAction(sprintId: string, body: unknown): Promise<ActionResult> {
  const result = await run(body, (b, s, u) => handleUpdateSprintRequest(sprintId, b, s, u));
  revalidatePath(`/app/commercial/sprints/${sprintId}`);
  revalidatePath("/app/commercial/sprints");
  return result;
}

export async function upsertSprintOutcomeAction(sprintId: string, body: unknown): Promise<ActionResult> {
  const result = await run(body, (b, s, u) => handleUpsertSprintOutcomeRequest(sprintId, b, s, u));
  revalidatePath(`/app/commercial/sprints/${sprintId}`);
  return result;
}

export async function createConversionAction(accountId: string, body: unknown): Promise<ActionResult> {
  const result = await run(body, handleCreateConversionRequest);
  revalidatePath(`/app/commercial/accounts/${accountId}`);
  revalidatePath("/app/commercial");
  return result;
}

export async function upsertCustomerReferenceAction(accountId: string, body: unknown): Promise<ActionResult> {
  const result = await run(body, handleUpsertCustomerReferenceRequest);
  revalidatePath(`/app/commercial/accounts/${accountId}`);
  return result;
}

export async function createActivityAction(body: unknown): Promise<ActionResult> {
  const result = await run(body, handleCreateActivityRequest);
  const opportunityId = (body as { opportunityId?: string }).opportunityId;
  const accountId = (body as { accountId?: string }).accountId;
  if (opportunityId) revalidatePath(`/app/commercial/opportunities/${opportunityId}`);
  if (accountId) revalidatePath(`/app/commercial/accounts/${accountId}`);
  return result;
}

export async function promoteInquiryAction(inquiryId: string, body: unknown): Promise<ActionResult> {
  const result = await run(body, (b, s, u) => handlePromoteInquiryRequest({ ...(b as Record<string, unknown>), inquiryId }, s, u));
  revalidatePath("/app/commercial");
  revalidatePath("/app/inquiries");
  return result;
}
