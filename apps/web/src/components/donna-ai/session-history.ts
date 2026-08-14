/**
 * Two real browser primitives, not a custom router or a new persistence
 * layer: `history.pushState`/`popstate` for Back/Forward through
 * meaningful Donna states, and `sessionStorage` for surviving a reload.
 * They serve different, complementary jobs — pushState's `state` object
 * carries the *sequence* of past snapshots a browser Back/Forward can
 * step through; sessionStorage only ever holds the single *latest*
 * snapshot, which is all a reload needs. Neither is a substitute for
 * the other, and this file adds nothing beyond thin, typed wrappers
 * around both — see the Founder report's "BROWSER BACK / HISTORY FIX".
 *
 * Every entry pushed carries `namespace` so DonnaAIExperience's
 * phase-level history and AdaptiveIntake's question-level history can
 * coexist on the same browser history stack without either
 * misinterpreting the other's popstate events.
 */

export interface DonnaHistoryEntry<T> {
  namespace: string;
  snapshot: T;
}

function isDonnaHistoryEntry<T>(value: unknown, namespace: string): value is DonnaHistoryEntry<T> {
  return typeof value === "object" && value !== null && (value as { namespace?: unknown }).namespace === namespace;
}

/** Pushes a new history entry carrying the full snapshot — no URL
 * change (SPA-internal navigation only), so this never touches routing
 * or triggers a real page transition. */
export function pushDonnaHistoryState<T>(namespace: string, snapshot: T): void {
  if (typeof window === "undefined") return;
  const entry: DonnaHistoryEntry<T> = { namespace, snapshot };
  window.history.pushState(entry, "", window.location.href);
}

/** Reads a popstate event's carried state, but only if it belongs to
 * this namespace — a Back press that lands on some other entry (a
 * different namespace, or one pushed before Donna's own history began)
 * correctly returns null rather than misapplied cross-talk. */
export function readDonnaHistoryState<T>(event: PopStateEvent, namespace: string): T | null {
  return isDonnaHistoryEntry<T>(event.state, namespace) ? event.state.snapshot : null;
}

/** The current entry's own state — used on mount to recover from a
 * reload (the browser preserves history.state for the top-of-stack
 * entry across a reload, the same mechanism SPA frameworks generally
 * rely on for exactly this). */
export function readCurrentDonnaHistoryState<T>(namespace: string): T | null {
  if (typeof window === "undefined") return null;
  return isDonnaHistoryEntry<T>(window.history.state, namespace) ? window.history.state.snapshot : null;
}

export function persistToSessionStorage<T>(key: string, snapshot: T): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    // Storage full or unavailable (private browsing, etc.) — a lost
    // reload-recovery convenience, never a reason to break the actual
    // assessment in progress.
  }
}

export function restoreFromSessionStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearSessionStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Same non-fatal reasoning as persistToSessionStorage.
  }
}
