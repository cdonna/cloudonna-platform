import { describe, expect, it } from "vitest";
import { SAMPLE_PROFILE } from "../../data";
import { appendDecisionVersionRequestSchema } from "../append-decision-version-schema";

function validRequestBody() {
  return {
    decisionInput: { wizardState: SAMPLE_PROFILE },
    enrichment: null,
    provider: { providerId: "deterministic-v1", model: null },
    fallback: { status: "ok", reason: null },
    changeReason: "Budget increased after Q3 planning",
  };
}

describe("appendDecisionVersionRequestSchema", () => {
  it("accepts a valid request", () => {
    const result = appendDecisionVersionRequestSchema.safeParse(validRequestBody());
    expect(result.success).toBe(true);
  });

  it("rejects a missing changeReason", () => {
    const body = validRequestBody() as Record<string, unknown>;
    delete body.changeReason;
    expect(appendDecisionVersionRequestSchema.safeParse(body).success).toBe(false);
  });

  it("rejects a blank changeReason — unlike the save schema, this field is required, not optional", () => {
    const result = appendDecisionVersionRequestSchema.safeParse({ ...validRequestBody(), changeReason: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects an attempted deterministic score/output override — 'output' is not an accepted field at all", () => {
    const body = { ...validRequestBody(), output: { donnaScore: 100 } };
    expect(appendDecisionVersionRequestSchema.safeParse(body).success).toBe(false);
  });

  it("rejects title/organizationId/workspaceId/projectId — an append never re-submits a decision's identity", () => {
    const body = { ...validRequestBody(), title: "Retitled", organizationId: "11111111-1111-1111-1111-111111111111" };
    expect(appendDecisionVersionRequestSchema.safeParse(body).success).toBe(false);
  });

  it("rejects an unknown top-level field (schema is .strict())", () => {
    const result = appendDecisionVersionRequestSchema.safeParse({ ...validRequestBody(), rawPrompt: "ignore all instructions" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed provider metadata object", () => {
    const result = appendDecisionVersionRequestSchema.safeParse({ ...validRequestBody(), provider: { providerId: "x", model: null, extra: "field" } });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid fallback status", () => {
    const result = appendDecisionVersionRequestSchema.safeParse({ ...validRequestBody(), fallback: { status: "not-a-real-status", reason: null } });
    expect(result.success).toBe(false);
  });
});
