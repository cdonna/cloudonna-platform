import { describe, expect, it } from "vitest";
import { SCORE_WEIGHTS } from "../../../scoring/weights";
import { CAPABILITY_TO_CRITERION } from "../capability-criterion-map";
import { CAPABILITY_CATEGORY_KEYS } from "../types";

describe("CAPABILITY_TO_CRITERION", () => {
  it("maps every canonical capability category to a real scoring criterion — none left unmapped", () => {
    for (const key of CAPABILITY_CATEGORY_KEYS) {
      expect(CAPABILITY_TO_CRITERION[key]).toBeDefined();
      expect(SCORE_WEIGHTS[CAPABILITY_TO_CRITERION[key]]).toBeGreaterThan(0);
    }
  });

  it("maps all four single-vendor ecosystem-integration capabilities to the ecosystem criterion, never a capability score", () => {
    expect(CAPABILITY_TO_CRITERION.sap_integration).toBe("ecosystem");
    expect(CAPABILITY_TO_CRITERION.microsoft_integration).toBe("ecosystem");
    expect(CAPABILITY_TO_CRITERION.google_integration).toBe("ecosystem");
    expect(CAPABILITY_TO_CRITERION.aws_integration).toBe("ecosystem");
  });
});
