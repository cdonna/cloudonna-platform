import "server-only";

/**
 * The first real external IntelligenceProvider. Server-only (guaranteed
 * by the `server-only` import above, not just by convention — a client
 * component that transitively imports this file fails the build). See
 * docs/intelligence/provider-boundaries.md.
 *
 * No OpenAI-specific type crosses this file's boundary: `enrich()`
 * returns the same `IntelligenceResult` every provider returns, built
 * from the SDK's response inside this module only.
 */
import OpenAI, { APIConnectionTimeoutError, APIError, RateLimitError } from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { IntelligenceConfig } from "../config";
import type { IntelligenceProvider } from "../provider";
import { buildPromptMessages } from "../prompt";
import { intelligenceEnrichmentSchema } from "../schema";
import type { IntelligenceError, IntelligenceResult } from "../types";

/** Normalizes whatever the SDK threw into the same small, safe-to-log
 * shape regardless of failure mode — never the SDK's own error message,
 * which can include request ids or other internals not meant for a
 * client or a log line. */
export function classifyOpenAIError(err: unknown): IntelligenceError {
  if (err instanceof RateLimitError) {
    return { code: "rate_limited", message: "The provider reported a rate limit." };
  }
  if (err instanceof APIConnectionTimeoutError) {
    return { code: "timeout", message: "The provider connection timed out." };
  }
  if (err instanceof APIError) {
    return { code: "network_error", message: `The provider returned an error (status ${err.status ?? "unknown"}).` };
  }
  if (err instanceof Error && err.name === "AbortError") {
    return { code: "timeout", message: "The provider request was aborted (timeout)." };
  }
  return { code: "unknown", message: "An unexpected provider error occurred." };
}

function toIntelligenceResult(error: IntelligenceError): IntelligenceResult {
  switch (error.code) {
    case "rate_limited":
      return { status: "rate_limited", reason: error.message };
    case "timeout":
      return { status: "timeout", reason: error.message };
    case "network_error":
    case "unknown":
    default:
      return { status: "unavailable", reason: error.message };
  }
}

export function createOpenAIIntelligenceProvider(config: IntelligenceConfig): IntelligenceProvider {
  const providerId = `openai-${config.model}`;

  if (!config.apiKey) {
    // Defensive only — callers are expected to check config.provider
    // before constructing this (see orchestrator wiring), so this branch
    // should be unreachable in practice.
    return {
      id: providerId,
      model: config.model,
      async enrich(): Promise<IntelligenceResult> {
        return { status: "disabled", reason: "No API key configured." };
      },
    };
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    timeout: config.timeoutMs,
    maxRetries: config.maxRetries,
  });

  return {
    id: providerId,
    model: config.model,

    async enrich(request): Promise<IntelligenceResult> {
      try {
        // Deliberately the plain `.create()` call, not the SDK's `.parse()`
        // convenience — this provider parses and validates the JSON
        // string itself, through the exact same `intelligenceEnrichmentSchema`
        // every other provider's output passes through (schema.ts), rather
        // than trusting a second, SDK-internal parsing path. `zodResponseFormat`
        // still gets OpenAI's own structured-output enforcement server-side;
        // this only changes who does the client-side parsing.
        const completion = await client.chat.completions.create({
          model: config.model,
          max_completion_tokens: config.maxOutputTokens,
          messages: buildPromptMessages(request),
          response_format: zodResponseFormat(intelligenceEnrichmentSchema, "intelligence_enrichment"),
        });

        const message = completion.choices[0]?.message;

        if (message?.refusal) {
          return { status: "invalid_output", reason: "The provider declined to produce a structured response." };
        }

        if (!message?.content) {
          return { status: "invalid_output", reason: "The provider response contained no content." };
        }

        let parsedJson: unknown;
        try {
          parsedJson = JSON.parse(message.content);
        } catch {
          return { status: "invalid_output", reason: "The provider response was not valid JSON." };
        }

        const validated = intelligenceEnrichmentSchema.safeParse(parsedJson);
        if (!validated.success) {
          return { status: "invalid_output", reason: "The provider response failed schema validation." };
        }

        return { status: "ok", enrichment: validated.data };
      } catch (err) {
        return toIntelligenceResult(classifyOpenAIError(err));
      }
    },
  };
}
