"use client";

import { useEffect, useReducer, useRef } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AI_PLATFORM_OPTIONS,
  ANALYTICS_OPTIONS,
  BUDGET_OPTIONS,
  CLOUD_OPTIONS,
  COUNTRY_OPTIONS,
  CRM_OPTIONS,
  DATA_WAREHOUSE_OPTIONS,
  EMPLOYEE_OPTIONS,
  EMPTY_WIZARD_STATE,
  ERP_OPTIONS,
  GOAL_OPTIONS,
  INDUSTRY_OPTIONS,
  INTERNAL_SKILLS_OPTIONS,
  IT_ORG_SIZE_OPTIONS,
  PREFERRED_CLOUD_OPTIONS,
  PREFERRED_VENDOR_OPTIONS,
  REVENUE_OPTIONS,
  RISK_APPETITE_OPTIONS,
  TIMELINE_OPTIONS,
} from "../data";
import { canAdvanceFromStep, wizardReducer } from "../engine";
import {
  REVIEW_STEP_INDEX,
  type AiPlatform,
  type AnalyticsTool,
  type BudgetLevel,
  type CloudProvider,
  type Country,
  type CrmSystem,
  type DataWarehouseSystem,
  type EmployeeBand,
  type ErpSystem,
  type GoalTag,
  type Industry,
  type InternalSkills,
  type ItOrgSizeBand,
  type PreferredCloud,
  type PreferredVendor,
  type RevenueBand,
  type RiskAppetite,
  type TimelineLevel,
  type WizardState,
} from "../types";
import { ChipFields, ChipStep } from "./ChipStep";
import { ReviewStep } from "./ReviewStep";
import { WizardProgress } from "./WizardProgress";

/** True once industry/erp are both answered and the two progressive-
 * disclosure hints below have something real to react to — before
 * that, showing a hint about a selection that hasn't happened yet
 * would be noise, not intelligence. */
function isSapPresent(erp: WizardState["landscape"]["erp"]): boolean {
  return erp === "sap-s4hana" || erp === "sap-ecc";
}

export function IntakeWizard({
  onComplete,
}: {
  onComplete: (state: WizardState) => void;
}) {
  const [state, dispatch] = useReducer(wizardReducer, EMPTY_WIZARD_STATE);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [state.stepIndex]);

  const isReview = state.stepIndex === REVIEW_STEP_INDEX;
  // Company (0) and landscape (1) render as one merged "Context" stage
  // — the underlying two-step state model is untouched (see
  // WizardProgress.tsx's own comment), only the UI groups them.
  const isContextStage = state.stepIndex === 0 || state.stepIndex === 1;
  const contextComplete = canAdvanceFromStep(state, 0) && canAdvanceFromStep(state, 1);
  const canAdvance = isContextStage ? contextComplete : canAdvanceFromStep(state, state.stepIndex);
  const allStepsComplete = [0, 1, 2, 3].every((index) => canAdvanceFromStep(state, index));
  const showReviewShortcut = allStepsComplete && !isReview;
  const isMultiSelectStep = state.stepIndex === 2;
  const sapPresent = isSapPresent(state.landscape.erp);
  const isFinancialServices = state.company.industry === "financial-services";

  function handleNext() {
    if (isContextStage) {
      dispatch({ type: "GOTO_STEP", index: 2 });
      return;
    }
    dispatch({ type: "NEXT" });
  }

  function handleBack() {
    if (state.stepIndex === 2) {
      dispatch({ type: "GOTO_STEP", index: 0 });
      return;
    }
    dispatch({ type: "BACK" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
      <aside className="rounded-[2rem] border border-titanium bg-carbon p-6 shadow-nova-resting lg:sticky lg:top-6 lg:self-start">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-nova-accent text-white shadow-nova-glow">
            <Sparkles size={19} />
          </div>
          <div>
            <div className="font-semibold text-nova-ink">Donna AI</div>
            <div className="text-xs text-nova-ink-faint">Enterprise decision assistant</div>
          </div>
        </div>

        <div className="mt-7">
          <WizardProgress stepIndex={state.stepIndex} />
        </div>

        {isContextStage && (
          <button
            type="button"
            onClick={() => dispatch({ type: "LOAD_SAMPLE" })}
            className="mt-7 w-full rounded-xl border border-dashed border-titanium-strong bg-carbon-2 px-3.5 py-3 text-left text-sm font-medium text-nova-accent-strong transition-colors duration-control hover:bg-carbon"
          >
            Try a sample company
            <span className="mt-1 block text-xs font-normal text-nova-ink-faint">
              Pre-fills every stage so you can preview a full result.
            </span>
          </button>
        )}
      </aside>

      <div className="rounded-[2rem] border border-titanium bg-carbon p-6 shadow-nova-raised sm:p-8">
        <div key={isContextStage ? "context" : state.stepIndex} className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-2 duration-panel ease-nova-settle">
          {isContextStage && (
            <div>
              <p className="text-sm font-medium text-nova-accent-strong">Let&apos;s start with who you are.</p>
              <h3 ref={headingRef} tabIndex={-1} className="mt-2 text-2xl font-semibold text-nova-ink outline-none">
                Tell Donna about your company and landscape
              </h3>

              <div className="mt-6 space-y-8">
                <ChipFieldGroup
                  legend="About your company"
                  fields={[
                    {
                      legend: "Industry",
                      options: INDUSTRY_OPTIONS,
                      selected: state.company.industry ? [state.company.industry] : [],
                      onSelect: (value) => dispatch({ type: "SET_COMPANY_FIELD", field: "industry", value: value as Industry }),
                    },
                    {
                      legend: "Country",
                      options: COUNTRY_OPTIONS,
                      selected: state.company.country ? [state.company.country] : [],
                      onSelect: (value) => dispatch({ type: "SET_COMPANY_FIELD", field: "country", value: value as Country }),
                    },
                    {
                      legend: "Employees",
                      options: EMPLOYEE_OPTIONS,
                      selected: state.company.employees ? [state.company.employees] : [],
                      onSelect: (value) => dispatch({ type: "SET_COMPANY_FIELD", field: "employees", value: value as EmployeeBand }),
                    },
                    {
                      legend: "Revenue",
                      options: REVENUE_OPTIONS,
                      selected: state.company.revenue ? [state.company.revenue] : [],
                      onSelect: (value) => dispatch({ type: "SET_COMPANY_FIELD", field: "revenue", value: value as RevenueBand }),
                    },
                    {
                      legend: "IT organization size",
                      options: IT_ORG_SIZE_OPTIONS,
                      selected: state.company.itOrgSize ? [state.company.itOrgSize] : [],
                      onSelect: (value) => dispatch({ type: "SET_COMPANY_FIELD", field: "itOrgSize", value: value as ItOrgSizeBand }),
                    },
                  ]}
                  note={state.company.note}
                  onNoteChange={(value) => dispatch({ type: "SET_NOTE", step: "company", value })}
                  noteLabel="Anything else about your company? (optional)"
                  notePlaceholder={
                    isFinancialServices
                      ? "e.g. regulatory requirements (FINMA, GDPR, DORA) that should shape the recommendation..."
                      : "e.g. recently merged with a European subsidiary..."
                  }
                />

                <ChipFieldGroup
                  legend="Your current landscape"
                  fields={[
                    {
                      legend: "ERP",
                      options: ERP_OPTIONS,
                      selected: state.landscape.erp ? [state.landscape.erp] : [],
                      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "erp", value: value as ErpSystem }),
                    },
                    {
                      legend: "CRM",
                      options: CRM_OPTIONS,
                      selected: state.landscape.crm ? [state.landscape.crm] : [],
                      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "crm", value: value as CrmSystem }),
                    },
                    {
                      legend: "Analytics",
                      options: ANALYTICS_OPTIONS,
                      selected: state.landscape.analytics ? [state.landscape.analytics] : [],
                      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "analytics", value: value as AnalyticsTool }),
                    },
                    {
                      legend: "Data warehouse",
                      options: DATA_WAREHOUSE_OPTIONS,
                      selected: state.landscape.dataWarehouse ? [state.landscape.dataWarehouse] : [],
                      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "dataWarehouse", value: value as DataWarehouseSystem }),
                    },
                    {
                      legend: "Cloud",
                      options: CLOUD_OPTIONS,
                      selected: state.landscape.cloud ? [state.landscape.cloud] : [],
                      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "cloud", value: value as CloudProvider }),
                    },
                    {
                      legend: "AI platform",
                      options: AI_PLATFORM_OPTIONS,
                      selected: state.landscape.aiPlatform ? [state.landscape.aiPlatform] : [],
                      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "aiPlatform", value: value as AiPlatform }),
                    },
                  ]}
                  note={state.landscape.note}
                  onNoteChange={(value) => dispatch({ type: "SET_NOTE", step: "landscape", value })}
                  noteLabel="Anything else about your landscape? (optional)"
                  notePlaceholder="e.g. BW is scheduled for decommission next year..."
                />
              </div>
            </div>
          )}

          {state.stepIndex === 2 && (
            <ChipStep
              ref={headingRef}
              prompt="What matters most?"
              title="Your priorities"
              fields={[
                {
                  legend: "Primary goals (select all that apply)",
                  options: GOAL_OPTIONS,
                  selected: state.goals.goals,
                  onSelect: (value) => dispatch({ type: "TOGGLE_GOAL", value: value as GoalTag }),
                },
              ]}
              note={state.goals.note}
              onNoteChange={(value) => dispatch({ type: "SET_NOTE", step: "goals", value })}
              noteLabel="Anything Donna should know? (optional)"
              notePlaceholder="e.g. the board wants results within 12 months..."
            />
          )}

          {state.stepIndex === 3 && (
            <ChipStep
              ref={headingRef}
              prompt="Last thing — what should I consider as a constraint?"
              title="Your constraints"
              fields={[
                {
                  legend: "Budget",
                  options: BUDGET_OPTIONS,
                  selected: state.constraints.budget ? [state.constraints.budget] : [],
                  onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "budget", value: value as BudgetLevel }),
                },
                {
                  legend: "Timeline",
                  options: TIMELINE_OPTIONS,
                  selected: state.constraints.timeline ? [state.constraints.timeline] : [],
                  onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "timeline", value: value as TimelineLevel }),
                },
                {
                  legend: "Risk appetite",
                  options: RISK_APPETITE_OPTIONS,
                  selected: state.constraints.riskAppetite ? [state.constraints.riskAppetite] : [],
                  onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "riskAppetite", value: value as RiskAppetite }),
                },
                {
                  legend: "Preferred cloud",
                  options: PREFERRED_CLOUD_OPTIONS,
                  selected: state.constraints.preferredCloud ? [state.constraints.preferredCloud] : [],
                  onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "preferredCloud", value: value as PreferredCloud }),
                },
                {
                  legend: sapPresent ? "Preferred vendor — you mentioned SAP is already in place" : "Preferred vendor",
                  options: PREFERRED_VENDOR_OPTIONS,
                  selected: state.constraints.preferredVendor ? [state.constraints.preferredVendor] : [],
                  onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "preferredVendor", value: value as PreferredVendor }),
                },
                {
                  legend: "Internal skills",
                  options: INTERNAL_SKILLS_OPTIONS,
                  selected: state.constraints.internalSkills ? [state.constraints.internalSkills] : [],
                  onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "internalSkills", value: value as InternalSkills }),
                },
              ]}
              note={state.constraints.note}
              onNoteChange={(value) => dispatch({ type: "SET_NOTE", step: "constraints", value })}
              noteLabel="Anything else Donna should know? (optional)"
              notePlaceholder={
                sapPresent
                  ? "e.g. should the existing SAP investment influence this decision?"
                  : "e.g. procurement requires two vendor quotes..."
              }
            />
          )}

          {isReview && <ReviewStep ref={headingRef} state={state} onEditStep={(index) => dispatch({ type: "GOTO_STEP", index })} />}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-titanium pt-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={state.stepIndex === 0}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition-colors duration-control hover:text-nova-ink disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <div className="flex items-center gap-4">
            {showReviewShortcut && (
              <button
                type="button"
                onClick={() => dispatch({ type: "GOTO_STEP", index: REVIEW_STEP_INDEX })}
                className="text-sm font-medium text-nova-accent-strong transition-colors duration-control hover:text-nova-ink"
              >
                Back to review
              </button>
            )}

            {isReview ? (
              <Button onClick={() => onComplete(state)} className="h-11 bg-nova-accent px-6 text-white shadow-nova-glow hover:bg-nova-accent-strong">
                Analyze
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canAdvance} className="h-11 bg-nova-accent px-6 text-white shadow-nova-glow hover:bg-nova-accent-strong">
                Next
                <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>

        {!canAdvance && !isReview && (
          <p className="mt-3 text-right text-xs text-nova-ink-faint">
            {isMultiSelectStep ? "Pick at least one to continue." : "Answer every question to continue."}
          </p>
        )}
      </div>
    </div>
  );
}

/** A titled group of chip fields within the merged Context stage —
 * uses ChipFields directly (no prompt/heading of its own, since two of
 * these share one heading now — see ChipStep.tsx). */
function ChipFieldGroup({
  legend,
  fields,
  note,
  onNoteChange,
  noteLabel,
  notePlaceholder,
}: {
  legend: string;
  fields: React.ComponentProps<typeof ChipFields>["fields"];
  note: string;
  onNoteChange: (value: string) => void;
  noteLabel: string;
  notePlaceholder: string;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-nova-accent-strong">{legend}</h4>
      <div className="mt-4">
        <ChipFields fields={fields} note={note} onNoteChange={onNoteChange} noteLabel={noteLabel} notePlaceholder={notePlaceholder} />
      </div>
    </div>
  );
}
