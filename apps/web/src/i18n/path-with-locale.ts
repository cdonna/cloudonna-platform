import type { Locale } from "./locales";

/** Pure — kept in its own module (no "use client", no next/navigation
 * import) specifically so it's importable from a plain Vitest test
 * without pulling in Next's App Router client runtime, which doesn't
 * initialize correctly outside an actual Next.js render (see this
 * function's own test file for the failure that motivated the split). */
export function pathWithLocale(pathname: string, search: string, next: Locale): string {
  const segments = pathname.split("/");
  // segments[0] is "" (leading slash); segments[1] is the current locale.
  segments[1] = next;
  const path = segments.join("/") || `/${next}`;
  return search ? `${path}?${search}` : path;
}
