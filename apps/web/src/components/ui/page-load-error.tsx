/**
 * The ClouDonna-owned fallback for a Server Component page that
 * couldn't load — never the generic Next.js "This page couldn't load.
 * A server error occurred." screen. Root cause this exists for:
 * several /app pages called createSupabaseServerClient() unconditionally,
 * with no try/catch, as the first line of an async Server Component —
 * if that throws (unconfigured Supabase, or any other real failure),
 * the exception was uncaught and Next.js's default error boundary took
 * over the whole page. See each call site for the try/catch that now
 * renders this instead.
 */
export function PageLoadError({ message = "This page couldn't load right now." }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-titanium bg-carbon p-10 text-center">
      <p className="text-sm text-nova-ink-muted">{message}</p>
      <p className="mt-2 text-xs text-nova-ink-faint">Please try again in a moment.</p>
    </div>
  );
}
