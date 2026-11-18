import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { scoreAllPlatformsV2 } from "../../scoring/engine";
import { SAMPLE_PROFILE } from "../../data";

/**
 * Commercial / Decision neutrality firewall (brief §17/§18). The
 * Commercial Engine (apps/web/src/lib/commercial/) and the Decision
 * Engine (apps/web/src/components/donna-ai/) are structurally
 * separate modules with no import relationship in either direction —
 * this suite proves that, rather than asserting it in a comment that
 * could silently go stale.
 *
 * "Commercial and decision neutrality must remain structurally
 * separate" is checked two ways: a static scan (no file in the
 * scoring/engine path imports anything from lib/commercial, and
 * vice versa), and a signature-level proof that the scoring function
 * itself has no parameter through which a commercial fact (opportunity
 * value, package type, customer status, pipeline stage) could ever
 * enter — scoreAllPlatformsV2 takes a WizardState and nothing else.
 */

const DONNA_AI_ROOT = path.join(__dirname, "..", "..");
const COMMERCIAL_ROOT = path.join(__dirname, "..", "..", "..", "..", "lib", "commercial");
const DECISION_OUTCOMES_ROOT = path.join(__dirname, "..", "..", "..", "..", "lib", "decision-outcomes");
// The actual neutrality-sensitive surface: the deterministic scoring/
// recommendation path. components/donna-ai/workspace/ legitimately
// displays decision_outcomes/business_case_actuals/assumption_validations
// (Decision Workspace Remember stage, brief §40/§44) — that is the whole
// point of those tables existing — so the broader DONNA_AI_ROOT is too
// wide a net for THAT specific check; scoring/engine must never see this
// data, but the rest of the product legitimately can.
const SCORING_ENGINE_ROOTS = [path.join(DONNA_AI_ROOT, "scoring"), path.join(DONNA_AI_ROOT, "engine")];

function listTsFiles(dir: string): string[] {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      if (entry.name === "__tests__" || entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry.name)) files.push(full);
    }
  };
  walk(dir);
  return files;
}

describe("Commercial / Decision neutrality firewall", () => {
  it("no file under donna-ai/ (the Decision Engine) imports anything from lib/commercial/", () => {
    const offenders: string[] = [];
    for (const file of listTsFiles(DONNA_AI_ROOT)) {
      const content = fs.readFileSync(file, "utf-8");
      if (/from\s+["'].*lib\/commercial/.test(content) || /require\(["'].*lib\/commercial/.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no file under lib/commercial/ imports anything from the scoring engine or vendor-intelligence catalog", () => {
    const offenders: string[] = [];
    for (const file of listTsFiles(COMMERCIAL_ROOT)) {
      const content = fs.readFileSync(file, "utf-8");
      if (/from\s+["'].*donna-ai\/(scoring|engine|vendor-intelligence)/.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("scoreAllPlatformsV2's own signature has no parameter a commercial fact could ever occupy — only (state: WizardState) is accepted", () => {
    const enginePath = path.join(DONNA_AI_ROOT, "scoring", "engine.ts");
    const source = fs.readFileSync(enginePath, "utf-8");
    const signatureMatch = source.match(/export function scoreAllPlatformsV2\(([^)]*)\)/);
    expect(signatureMatch).not.toBeNull();
    const params = signatureMatch![1];
    // Exactly one parameter, typed WizardState — no second "context"
    // or "opportunity" parameter of any kind exists to smuggle a
    // commercial fact through.
    expect(params.split(",").map((p) => p.trim()).filter(Boolean)).toHaveLength(1);
    expect(params).toContain("WizardState");
  });

  it("identical WizardState input always produces an identical ranking, regardless of any commercial context a caller might separately hold", () => {
    // There is no API for a caller to attach commercial context to a
    // scoring call in the first place (proven above) — this is the
    // behavioral corollary: two calls with the same real input never
    // diverge, which they structurally could not do even if a caller
    // tried to pass something extra (TypeScript would reject the call).
    const a = scoreAllPlatformsV2(SAMPLE_PROFILE);
    const b = scoreAllPlatformsV2(SAMPLE_PROFILE);
    expect(a).toEqual(b);
  });

  it("no capability_categories/evidence-graph/business-case module name appears inside lib/commercial/'s own source as a vendor-fact override point", () => {
    // A more specific check than the blanket import scan above: even a
    // same-named local re-implementation of a scoring concept
    // (e.g. a hand-rolled "overallScore" field) inside the commercial
    // module would be a smell. None exists.
    const offenders: string[] = [];
    for (const file of listTsFiles(COMMERCIAL_ROOT)) {
      const content = fs.readFileSync(file, "utf-8");
      if (/overallScore|vendorRanking|recommendedOption/.test(content)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  // ---------------------------------------------------------------------
  // Revenue Operations & First Customer Engine V1 additions (brief §31).

  it("no file under donna-ai/ imports buyer-persona.ts — GTM reporting only, never a product-recommendation input", () => {
    const offenders: string[] = [];
    for (const file of listTsFiles(DONNA_AI_ROOT)) {
      const content = fs.readFileSync(file, "utf-8");
      if (/from\s+["'].*lib\/commercial\/buyer-persona/.test(content)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("no file under donna-ai/scoring/ or donna-ai/engine/ imports anything from lib/decision-outcomes/ — tenant outcome data never becomes a scoring input", () => {
    const offenders: string[] = [];
    for (const root of SCORING_ENGINE_ROOTS) {
      for (const file of listTsFiles(root)) {
        const content = fs.readFileSync(file, "utf-8");
        if (/from\s+["'].*lib\/decision-outcomes/.test(content)) offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("lib/commercial/ and lib/decision-outcomes/ never import from each other — staff-only sales data and tenant-private decision outcomes stay structurally separate (brief §36)", () => {
    const commercialOffenders: string[] = [];
    for (const file of listTsFiles(COMMERCIAL_ROOT)) {
      const content = fs.readFileSync(file, "utf-8");
      if (/from\s+["'].*lib\/decision-outcomes/.test(content)) commercialOffenders.push(file);
    }
    expect(commercialOffenders).toEqual([]);

    const decisionOutcomesOffenders: string[] = [];
    for (const file of listTsFiles(DECISION_OUTCOMES_ROOT)) {
      const content = fs.readFileSync(file, "utf-8");
      if (/from\s+["'].*lib\/commercial/.test(content)) decisionOutcomesOffenders.push(file);
    }
    expect(decisionOutcomesOffenders).toEqual([]);
  });

  it("no file under lib/decision-outcomes/ imports anything from the scoring engine or vendor-intelligence catalog", () => {
    const offenders: string[] = [];
    for (const file of listTsFiles(DECISION_OUTCOMES_ROOT)) {
      const content = fs.readFileSync(file, "utf-8");
      if (/from\s+["'].*donna-ai\/(scoring|engine|vendor-intelligence)/.test(content)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
