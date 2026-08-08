import { redirect } from "next/navigation";

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
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.type) ? params.type[0] : params.type;
  const mapped = raw ? LEGACY_TYPE_MAP[raw] : undefined;

  redirect(mapped ? `/contact?type=${mapped}` : "/contact?type=founding_tester");
}
