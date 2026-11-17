import { describe, expect, it } from "vitest";
import { VENDOR_CATALOG } from "../../vendor-intelligence/catalog";
import { EMPTY_WIZARD_STATE, SAMPLE_PROFILE } from "../../data";
import { evaluateConstraints, rollupEligibility } from "../constraints";

const sapBdc = VENDOR_CATALOG.find((p) => p.id === "sap-bdc")!;
const googleCloud = VENDOR_CATALOG.find((p) => p.id === "google-cloud")!;
const msFabric = VENDOR_CATALOG.find((p) => p.id === "ms-fabric")!;

describe("Constraint Engine", () => {
  it("returns UNKNOWN for every constraint when nothing was stated", () => {
    const evaluations = evaluateConstraints(EMPTY_WIZARD_STATE.constraints, sapBdc);
    expect(evaluations.every((e) => e.status === "UNKNOWN")).toBe(true);
    expect(rollupEligibility(evaluations)).toBe("conditionally_eligible");
  });

  it("passes vendor and cloud constraints for a platform that matches both", () => {
    // SAMPLE_PROFILE: preferredVendor "sap", preferredCloud "azure" — SAP BDC matches both.
    const evaluations = evaluateConstraints(SAMPLE_PROFILE.constraints, sapBdc);
    expect(evaluations.find((e) => e.id === "preferred-vendor")?.status).toBe("PASS");
    expect(evaluations.find((e) => e.id === "preferred-cloud")?.status).toBe("PASS");
    expect(rollupEligibility(evaluations)).toBe("eligible");
  });

  it("fails the vendor constraint for a non-matching vendor", () => {
    const evaluations = evaluateConstraints(SAMPLE_PROFILE.constraints, googleCloud);
    expect(evaluations.find((e) => e.id === "preferred-vendor")?.status).toBe("FAIL");
    expect(rollupEligibility(evaluations)).toBe("ineligible");
  });

  it("fails the cloud constraint for a platform not available on the required cloud", () => {
    // Microsoft Fabric is Azure-only; a company requiring GCP must fail it.
    const gcpRequired = { ...SAMPLE_PROFILE.constraints, preferredCloud: "gcp" as const, preferredVendor: "no-preference" as const };
    const evaluations = evaluateConstraints(gcpRequired, msFabric);
    expect(evaluations.find((e) => e.id === "preferred-cloud")?.status).toBe("FAIL");
    expect(rollupEligibility(evaluations)).toBe("ineligible");
  });

  it("passes both constraints when no-preference is explicitly stated", () => {
    const noPreference = { ...SAMPLE_PROFILE.constraints, preferredCloud: "no-preference" as const, preferredVendor: "no-preference" as const };
    const evaluations = evaluateConstraints(noPreference, googleCloud);
    expect(evaluations.every((e) => e.status === "PASS")).toBe(true);
    expect(rollupEligibility(evaluations)).toBe("eligible");
  });

  it("is deterministic: same input always produces the same evaluation", () => {
    const a = evaluateConstraints(SAMPLE_PROFILE.constraints, sapBdc);
    const b = evaluateConstraints(SAMPLE_PROFILE.constraints, sapBdc);
    expect(a).toEqual(b);
  });

  it("UI rendering contract: every platform's constraint list has the same ids in the same order (ConstraintsView builds one table column per id, positionally)", () => {
    const orders = VENDOR_CATALOG.map((platform) => evaluateConstraints(SAMPLE_PROFILE.constraints, platform).map((e) => e.id));
    const first = orders[0];
    for (const order of orders) {
      expect(order).toEqual(first);
    }
  });

  it("never reports FAIL and PASS simultaneously for the same constraint id", () => {
    for (const platform of VENDOR_CATALOG) {
      const evaluations = evaluateConstraints(SAMPLE_PROFILE.constraints, platform);
      const ids = evaluations.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
