import { handleDecisionRequest } from "@/components/donna-ai/intelligence/handle-decision-request";

/**
 * The only file in this codebase that reads OPENAI_API_KEY (transitively,
 * via handleDecisionRequest -> config.ts). Node.js runtime, not Edge —
 * simplest, fewest SDK-compatibility surprises, and this route has no
 * latency requirement that needs Edge. See
 * docs/intelligence/donna-intelligence-architecture.md, "Vercel runtime".
 */
export const runtime = "nodejs";

/** Comfortably above the orchestrator's own enrichment timeout
 * (config.timeoutMs, 8s default) plus deterministic compute overhead —
 * the orchestrator's internal timeout should always fire before this
 * platform-level one does. */
export const maxDuration = 15;

function getRateLimitKey(request: Request): string {
  // Best-effort client identifier for the in-memory rate limiter — not a
  // real abuse-protection system (see rate-limit.ts). Vercel populates
  // x-forwarded-for; falls back to a shared bucket if absent, which is
  // honest (no per-client key exists without it) rather than pretending
  // to isolate clients it can't actually distinguish.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

export async function POST(request: Request): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const result = await handleDecisionRequest(rawBody, getRateLimitKey(request));
  return Response.json(result.body, { status: result.status });
}
