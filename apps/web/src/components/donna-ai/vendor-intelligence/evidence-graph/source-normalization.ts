/**
 * Canonical source normalization (brief §9). Deterministic, no
 * network access, conservative — the goal is to recognize "this is the
 * exact same page" (a fragment, a trailing slash, a known tracking
 * parameter), never to collapse two genuinely different pages that
 * happen to share a domain or path prefix.
 */
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "referrer",
]);

export function canonicalizeSourceUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    // Not a parseable absolute URL — return the trimmed input
    // unchanged rather than throwing; callers decide what to do with
    // an unparseable value (never silently drop it).
    return rawUrl.trim();
  }

  // Fragment never distinguishes a different document for canonical
  // identity purposes — #section-2 is the same page as the bare URL.
  parsed.hash = "";

  // Strip known tracking parameters only — an unrecognized query
  // parameter is left alone, since it may genuinely select different
  // content (e.g. ?version=2026) and collapsing it would be exactly
  // the "aggressive collapsing of genuinely different pages" brief §9
  // warns against.
  const params = parsed.searchParams;
  for (const key of Array.from(params.keys())) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) params.delete(key);
  }
  const query = params.toString();
  parsed.search = query ? `?${query}` : "";

  // Host is lowercased by URL parsing already; lowercase a trailing-
  // slash-insensitive path by stripping exactly one trailing slash
  // (never collapsing "/docs/" to "/docs" for paths that are not a
  // simple trailing slash, e.g. never touch "//" inside a path).
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}

export function sameCanonicalSource(urlA: string, urlB: string): boolean {
  return canonicalizeSourceUrl(urlA) === canonicalizeSourceUrl(urlB);
}
