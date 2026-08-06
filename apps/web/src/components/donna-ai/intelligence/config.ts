import "server-only";

/**
 * The single place this domain reads an environment variable. Nowhere
 * else in `intelligence/` — not the orchestrator, not the knowledge
 * provider, not the schema — touches `process.env`. `import "server-only"`
 * makes that a build-time guarantee, not a convention: any client
 * component that transitively imports this file fails the Next.js build
 * rather than silently bundling a server-only module. See
 * docs/intelligence/security-and-privacy.md, "Server-only provider calls".
 */

export interface IntelligenceConfig {
  provider: "openai" | "none";
  model: string;
  apiKey: string | undefined;
  timeoutMs: number;
  maxOutputTokens: number;
  maxRetries: number;
}

/**
 * Not a recommendation to hardcode elsewhere — this is the one place a
 * default model name is allowed to live, and only as a fallback when
 * DONNA_AI_MODEL is unset. Every other module receives the model name
 * through config, never a literal.
 */
const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_OUTPUT_TOKENS = 1600;
const DEFAULT_MAX_RETRIES = 1;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/**
 * Reads configuration fresh on every call rather than caching a module-
 * level singleton — deliberately, so there is no hidden global state a
 * test could leak between cases (each test that cares about config calls
 * this once, with its own environment). Cheap enough to call per-request.
 */
export function loadIntelligenceConfig(): IntelligenceConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim() || undefined;

  return {
    provider: apiKey ? "openai" : "none",
    model: process.env.DONNA_AI_MODEL?.trim() || DEFAULT_MODEL,
    apiKey,
    timeoutMs: parsePositiveInt(process.env.DONNA_AI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    maxOutputTokens: parsePositiveInt(process.env.DONNA_AI_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS),
    maxRetries: parsePositiveInt(process.env.DONNA_AI_MAX_RETRIES, DEFAULT_MAX_RETRIES),
  };
}
