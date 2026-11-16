import { describe, expect, it } from "vitest";
import { createTaskRequestSchema, reviewTaskRequestSchema, mergeTaskRequestSchema, deployTaskRequestSchema } from "../schema";

describe("createTaskRequestSchema", () => {
  const VALID = {
    title: "Polish the Architects page",
    description: "Bring spacing and type in line with the editorial system.",
    targetArea: "architects",
    acceptanceCriteria: "Visually consistent with /data-economy.",
  };

  it("accepts a minimal valid task, defaulting priority to medium", () => {
    const result = createTaskRequestSchema.safeParse(VALID);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe("medium");
  });

  it("rejects an unknown targetArea rather than passing it through as free text", () => {
    const result = createTaskRequestSchema.safeParse({ ...VALID, targetArea: "marketing" });
    expect(result.success).toBe(false);
  });

  it("rejects a blank title", () => {
    const result = createTaskRequestSchema.safeParse({ ...VALID, title: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a blank acceptanceCriteria — 'what done looks like' is mandatory", () => {
    const result = createTaskRequestSchema.safeParse({ ...VALID, acceptanceCriteria: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown field (.strict())", () => {
    const result = createTaskRequestSchema.safeParse({ ...VALID, injectSql: "'; drop table founder_tasks;" });
    expect(result.success).toBe(false);
  });
});

describe("reviewTaskRequestSchema", () => {
  it("accepts approved with no notes", () => {
    expect(reviewTaskRequestSchema.safeParse({ decision: "approved" }).success).toBe(true);
  });

  it("rejects a decision outside the three allowed values", () => {
    expect(reviewTaskRequestSchema.safeParse({ decision: "maybe" }).success).toBe(false);
  });
});

describe("mergeTaskRequestSchema / deployTaskRequestSchema", () => {
  it("both accept an empty body", () => {
    expect(mergeTaskRequestSchema.safeParse({}).success).toBe(true);
    expect(deployTaskRequestSchema.safeParse({}).success).toBe(true);
  });
});
