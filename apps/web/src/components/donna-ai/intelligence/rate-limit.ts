/**
 * Rate-limit / abuse-protection seam. Explicitly a seam, not a production
 * system: there is no distributed store, no per-organization quota, and
 * no persistence — there is nowhere safe to keep that state yet (no auth,
 * no tenant scoping wired to this domain). What exists here is the
 * *interface* every call site is already written against, so wiring in a
 * real limiter later (Upstash, a database-backed counter, whatever fits
 * the eventual multi-tenant deployment) is a one-file change, not a
 * refactor of the orchestrator. See docs/intelligence/cost-controls.md.
 */

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
}

export interface RateLimiter {
  checkAndConsume(key: string): RateLimitResult | Promise<RateLimitResult>;
}

/** The default: always allows. Matches today's reality (no abuse
 * protection is actually enforced yet) honestly, rather than pretending
 * a limit exists by returning an arbitrary number nobody chose. */
export const noopRateLimiter: RateLimiter = {
  checkAndConsume: () => ({ allowed: true }),
};

/**
 * A simple in-memory fixed-window limiter — usable for local development
 * and single-instance deployments, explicitly NOT usable across multiple
 * server instances (the count resets per-process, and Vercel's serverless
 * functions are not guaranteed to share memory between invocations). Kept
 * here as a real, working reference implementation of the interface
 * above, not as the production answer.
 */
export function createInMemoryRateLimiter(options: { maxPerWindow: number; windowMs: number }): RateLimiter {
  const counts = new Map<string, { count: number; windowStart: number }>();

  return {
    checkAndConsume(key: string): RateLimitResult {
      const now = Date.now();
      const entry = counts.get(key);

      if (!entry || now - entry.windowStart >= options.windowMs) {
        counts.set(key, { count: 1, windowStart: now });
        return { allowed: true };
      }

      if (entry.count >= options.maxPerWindow) {
        return { allowed: false, reason: "Rate limit exceeded for this window." };
      }

      entry.count += 1;
      return { allowed: true };
    },
  };
}
