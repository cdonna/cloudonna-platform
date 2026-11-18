import "server-only";

/** The only module that reads/writes commercial_contacts (brief §5/§6). */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateCommercialContactRequest, UpdateCommercialContactRequest } from "./schema";
import type { BuyerPersona } from "./buyer-persona";

export type RepositoryResult<T> = { ok: true; data: T } | { ok: false; reason: string };

function classifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) return "You do not have access to commercial data.";
  return "The request could not be processed.";
}

export interface CommercialContactSummary {
  id: string;
  accountId: string;
  name: string;
  email: string | null;
  role: string | null;
  phone: string | null;
  buyerPersona: BuyerPersona | null;
  economicBuyer: boolean;
  decisionMaker: boolean;
  technicalEvaluator: boolean;
  champion: boolean;
  procurement: boolean;
  createdAt: string;
}

const CONTACT_SELECT =
  "id, account_id, name, email, role, phone, buyer_persona, economic_buyer, decision_maker, technical_evaluator, champion, procurement, created_at";

interface ContactRow {
  id: string;
  account_id: string;
  name: string;
  email: string | null;
  role: string | null;
  phone: string | null;
  buyer_persona: BuyerPersona | null;
  economic_buyer: boolean;
  decision_maker: boolean;
  technical_evaluator: boolean;
  champion: boolean;
  procurement: boolean;
  created_at: string;
}

function mapContact(row: ContactRow): CommercialContactSummary {
  return {
    id: row.id,
    accountId: row.account_id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    buyerPersona: row.buyer_persona,
    economicBuyer: row.economic_buyer,
    decisionMaker: row.decision_maker,
    technicalEvaluator: row.technical_evaluator,
    champion: row.champion,
    procurement: row.procurement,
    createdAt: row.created_at,
  };
}

export async function createCommercialContact(supabase: SupabaseClient, request: CreateCommercialContactRequest): Promise<RepositoryResult<CommercialContactSummary>> {
  const { data, error } = await supabase
    .from("commercial_contacts")
    .insert({
      account_id: request.accountId,
      name: request.name,
      email: request.email ?? null,
      role: request.role ?? null,
      phone: request.phone ?? null,
      buyer_persona: request.buyerPersona ?? null,
      economic_buyer: request.economicBuyer ?? false,
      decision_maker: request.decisionMaker ?? false,
      technical_evaluator: request.technicalEvaluator ?? false,
      champion: request.champion ?? false,
      procurement: request.procurement ?? false,
    })
    .select(CONTACT_SELECT)
    .single();

  if (error || !data) return { ok: false, reason: classifyError(error?.message ?? "") };
  return { ok: true, data: mapContact(data as ContactRow) };
}

export async function updateCommercialContact(supabase: SupabaseClient, contactId: string, request: UpdateCommercialContactRequest): Promise<RepositoryResult<CommercialContactSummary>> {
  const patch: Record<string, unknown> = {};
  if (request.name !== undefined) patch.name = request.name;
  if (request.email !== undefined) patch.email = request.email;
  if (request.role !== undefined) patch.role = request.role;
  if (request.phone !== undefined) patch.phone = request.phone;
  if (request.buyerPersona !== undefined) patch.buyer_persona = request.buyerPersona;
  if (request.economicBuyer !== undefined) patch.economic_buyer = request.economicBuyer;
  if (request.decisionMaker !== undefined) patch.decision_maker = request.decisionMaker;
  if (request.technicalEvaluator !== undefined) patch.technical_evaluator = request.technicalEvaluator;
  if (request.champion !== undefined) patch.champion = request.champion;
  if (request.procurement !== undefined) patch.procurement = request.procurement;

  const { data, error } = await supabase.from("commercial_contacts").update(patch).eq("id", contactId).select(CONTACT_SELECT).maybeSingle();
  if (error) return { ok: false, reason: classifyError(error.message) };
  if (!data) return { ok: false, reason: "This contact could not be found or updated." };
  return { ok: true, data: mapContact(data as ContactRow) };
}

export async function listContactsForAccount(supabase: SupabaseClient, accountId: string): Promise<RepositoryResult<CommercialContactSummary[]>> {
  const { data, error } = await supabase.from("commercial_contacts").select(CONTACT_SELECT).eq("account_id", accountId).order("created_at");
  if (error) return { ok: false, reason: classifyError(error.message) };
  return { ok: true, data: ((data as ContactRow[] | null) ?? []).map(mapContact) };
}

export async function accountHasEconomicBuyer(supabase: SupabaseClient, accountId: string): Promise<boolean> {
  const { data, error } = await supabase.from("commercial_contacts").select("id").eq("account_id", accountId).eq("economic_buyer", true).limit(1);
  if (error) return false;
  return (data ?? []).length > 0;
}

/** Bulk form of accountHasEconomicBuyer, for a dashboard needing the
 * answer for every account in one query rather than one round-trip
 * per account. */
export async function listAccountIdsWithEconomicBuyer(supabase: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await supabase.from("commercial_contacts").select("account_id").eq("economic_buyer", true);
  if (error) return new Set();
  return new Set((data ?? []).map((r: { account_id: string }) => r.account_id));
}

/** Count of distinct contacts flagged as a buying decision-maker or
 * economic buyer for one account — the derivable half of
 * expansion-signals.ts's "multiple executive stakeholders" signal. */
export async function countExecutiveStakeholders(supabase: SupabaseClient, accountId: string): Promise<number> {
  const { count, error } = await supabase.from("commercial_contacts").select("id", { count: "exact", head: true }).eq("account_id", accountId).or("economic_buyer.eq.true,decision_maker.eq.true");
  if (error) return 0;
  return count ?? 0;
}
