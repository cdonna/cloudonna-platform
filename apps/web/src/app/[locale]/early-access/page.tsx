import { notFound, redirect } from "next/navigation";
import { isSupportedLocale } from "@/i18n/locales";

/**
 * The standalone /early-access route is kept only so existing links
 * (bookmarks, the old ?type= query convention) keep working — the real
 * implementation is /contact + InquiryForm now. No duplicate form
 * exists here. Old ?type= values (customer/vendor/partner/community)
 * map onto the new six-way inquiry taxonomy.
 */
const LEGACY_TYPE_MAP: Record<string, string> = {
  customer: "founding_tester",
  vendor: "vendor",
  partner: "partner",
  community: "general",
};

export default async function EarlyAccessRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const sp = await searchParams;
  const raw = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const mapped = raw ? LEGACY_TYPE_MAP[raw] : undefined;

  redirect(`/${locale}/contact?type=${mapped ?? "founding_tester"}`);
}
