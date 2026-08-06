import "server-only";

/**
 * The framework-independent request handler behind
 * app/api/donna-ai/decision/route.ts. Deliberately has no dependency on
 * `NextRequest`/`NextResponse` or the Fetch API `Request`/`Response`
 * types — it takes a plain parsed body and returns a plain
 * `{ status, body }` result, so it's testable with ordinary objects and
 * so the route file itself stays a thin, obviously-correct adapter. See
 * docs/intelligence/donna-intelligence-architecture.md.
 */
import { loadIntelligenceConfig } from "./config";
import { createInMemoryRateLimiter } from "./rate-limit";
import { createRecommendationOrchestrator, DEFAULT_ORCHESTRATOR_CONFIG } from "./orchestrator";
import { selectIntelligenceProvider } from "./select-provider";
import type { DecisionReport } from "./types";

export interface DecisionRequestBody {
  wizardState: unknown;
}

export interface HandlerResult {
  status: number;
  body: { report: DecisionReport } | { error: string };
}

/** Module-scoped, not request-scoped — a fresh limiter per request would
 * limit nothing. Explicitly the in-memory reference implementation (see
 * rate-limit.ts's own caveats about multi-instance deployments); replacing
 * it with a real distributed limiter later means changing this one line,
 * not the route or the orchestrator. */
const rateLimiter = createInMemoryRateLimiter({ maxPerWindow: 20, windowMs: 60_000 });

function isPlainObjectWithWizardState(value: unknown): value is DecisionRequestBody {
  return typeof value === "object" && value !== null && "wizardState" in value;
}

export async function handleDecisionRequest(rawBody: unknown, rateLimitKey: string): Promise<HandlerResult> {
  if (!isPlainObjectWithWizardState(rawBody)) {
    return { status: 400, body: { error: "Request body must be a JSON object with a wizardState field." } };
  }

  const config = loadIntelligenceConfig();
  const provider = selectIntelligenceProvider(config);
  const orchestrator = createRecommendationOrchestrator({
    ...DEFAULT_ORCHESTRATOR_CONFIG,
    intelligenceProvider: provider,
    enrichmentTimeoutMs: config.timeoutMs,
    rateLimiter,
  });

  try {
    const report = await orchestrator.createDecision(
      { wizardState: rawBody.wizardState as never },
      { rateLimitKey },
    );
    return { status: 200, body: { report } };
  } catch (err) {
    // Every error surfaced here is safe, generic text — never the
    // underlying Zod validation detail or any other internal message.
    // Rate-limit rejections and malformed-input rejections both land
    // here (see orchestrator.ts, step 0 and step 1) and are
    // indistinguishable to the caller on purpose: neither should hint at
    // internal validation logic to a client probing the endpoint.
    const isRateLimit = err instanceof Error && err.message.toLowerCase().includes("rate limit");
    return {
      status: isRateLimit ? 429 : 400,
      body: { error: isRateLimit ? "Too many requests. Please try again shortly." : "The request could not be processed." },
    };
  }
}
