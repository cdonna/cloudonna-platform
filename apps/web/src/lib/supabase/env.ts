/**
 * The only two Supabase environment variables any client in this domain
 * is allowed to read. Both are `NEXT_PUBLIC_*` by necessity — the anon
 * key is designed to be public (it identifies the project, not a
 * privilege; every real permission it carries is enforced by RLS) — but
 * centralizing the read here, once, means no other file grep for
 * `process.env.NEXT_PUBLIC_SUPABASE` scattered around. See
 * docs/sprint-6/17-auth-implementation.md.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const env = tryGetSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured — NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must both be set. See .env.example.",
    );
  }
  return env;
}

/** Non-throwing variant — the one callers on a shared, always-runs code
 * path (middleware) must use instead of getSupabaseEnv(), so an
 * unconfigured Supabase project degrades to "auth is unavailable," not
 * "the entire site is down." Every non-auth route, including the
 * unauthenticated Donna AI flow, must keep working with zero Supabase
 * configuration — the same "runs without configuration" guarantee
 * Sprint 5 already established for OPENAI_API_KEY. */
export function tryGetSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

/** True when Supabase auth/persistence is configured at all — the one
 * check the UI uses to decide whether to show auth-gated affordances
 * (Save Decision, account menu) or the anonymous-only experience. */
export function isSupabaseConfigured(): boolean {
  return tryGetSupabaseEnv() !== null;
}
