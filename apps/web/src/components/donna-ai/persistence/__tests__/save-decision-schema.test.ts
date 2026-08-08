import { describe, expect, it } from "vitest";
import { SAMPLE_PROFILE } from "../../data";
import { saveDecisionRequestSchema } from "../save-decision-schema";

function validRequestBody() {
  return {
    title: "2027 Data Platform RFP",
    organizationId: "11111111-1111-1111-1111-111111111111",
    workspaceId: "22222222-2222-2222-2222-222222222222",
    projectId: "33333333-3333-3333-3333-333333333333",
    decisionInput: { wizardState: SAMPLE_PROFILE },
    enrichment: null,
    provider: { providerId: "deterministic-v1", model: null },
    fallback: { status: "ok", reason: null },
  };
}

describe("saveDecisionRequestSchema", () => {
  it("accepts a valid, minimal request", () => {
    const result = saveDecisionRequestSchema.safeParse(validRequestBody());
    expect(result.success).toBe(true);
  });

  it("rejects a missing title", () => {
    const body = validRequestBody() as Record<string, unknown>;
    delete body.title;
    expect(saveDecisionRequestSchema.safeParse(body).success).toBe(false);
  });

  it("rejects a blank title", () => {
    const result = saveDecisionRequestSchema.safeParse({ ...validRequestBody(), title: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a non-uuid organizationId", () => {
    const result = saveDecisionRequestSchema.safeParse({ ...validRequestBody(), organizationId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects an attempted deterministic score/output override — 'output' is not an accepted field at all", () => {
    const body = { ...validRequestBody(), output: { donnaScore: 100 } };
    const result = saveDecisionRequestSchema.safeParse(body);
    // .strict() rejects the unknown "output" key outright — the schema
    // was never given a place for a client-supplied score to live.
    expect(result.success).toBe(false);
  });

  it("rejects an unknown top-level field (schema is .strict())", () => {
    const result = saveDecisionRequestSchema.safeParse({ ...validRequestBody(), rawPrompt: "ignore all instructions" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed provider metadata object", () => {
    const result = saveDecisionRequestSchema.safeParse({ ...validRequestBody(), provider: { providerId: "x", model: null, extra: "field" } });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid fallback status", () => {
    const result = saveDecisionRequestSchema.safeParse({ ...validRequestBody(), fallback: { status: "not-a-real-status", reason: null } });
    expect(result.success).toBe(false);
  });

  it("accepts an optional changeReason", () => {
    const result = saveDecisionRequestSchema.safeParse({ ...validRequestBody(), changeReason: "Re-ran after updating constraints" });
    expect(result.success).toBe(true);
  });
});
