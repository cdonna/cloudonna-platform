import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Uniform error shape thrown by every repository method. Wraps whatever
 * PostgREST/Postgres returned without reinterpreting it — a repository's
 * job is to surface what the database said, not to decide what it means
 * (e.g. whether a unique-violation should become a user-facing "that name
 * is taken" message is a service-layer concern).
 */
export class RepositoryError extends Error {
  readonly cause?: PostgrestError;

  constructor(operation: string, cause?: PostgrestError) {
    super(cause ? `${operation} failed: ${cause.message}` : `${operation} failed`);
    this.name = "RepositoryError";
    this.cause = cause;
  }
}

/**
 * Every method below eventually calls one of these two, rather than
 * chaining supabase-js's `.returns<T>()` at each call site. There is no
 * live Supabase project to run `supabase gen types typescript` against yet
 * (see types.ts header) — without generated types, postgrest-js's
 * `.returns<T>()` has to guess whether the row shape ahead of it in the
 * chain is an array or a single object, and gets it wrong differently
 * depending on `.single()`/`.maybeSingle()`/`.rpc()`. Asserting the shape
 * once, here, against our own hand-authored types (types.ts) is simpler
 * and no less honest than fighting that inference chain in 30 call sites.
 * Replace both with real generated types once a project exists.
 */
export function assertNoError<T>(operation: string, result: { data: unknown; error: PostgrestError | null }): T {
  if (result.error) {
    throw new RepositoryError(operation, result.error);
  }
  if (result.data === null || result.data === undefined) {
    throw new RepositoryError(`${operation} (no row returned)`);
  }
  return result.data as T;
}

export function assertMaybe<T>(operation: string, result: { data: unknown; error: PostgrestError | null }): T | null {
  if (result.error) {
    throw new RepositoryError(operation, result.error);
  }
  return (result.data as T | null) ?? null;
}
