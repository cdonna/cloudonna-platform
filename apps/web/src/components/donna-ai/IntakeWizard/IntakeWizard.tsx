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
import type { ChipField } from "./ChipStep";
import { ConversationalFieldFlow } from "./ConversationalFieldFlow";
import { ReviewStep } from "./ReviewStep";
import { WizardProgress } from "./WizardProgress";

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
  // Company (0) and landscape (1) are one continuous conversational
  // stage — "Context" — not two screens and not eleven simultaneous
  // fields either. See ConversationalFieldFlow: one question at a
  // time, auto-advancing. The underlying two-step state model
  // (WizardState, wizardReducer, canAdvanceFromStep) is completely
  // untouched — only how these same fields get answered changed.
  const isContextStage = state.stepIndex === 0 || state.stepIndex === 1;
  const contextComplete = canAdvanceFromStep(state, 0) && canAdvanceFromStep(state, 1);
  const canAdvance = isContextStage ? contextComplete : canAdvanceFromStep(state, state.stepIndex);
  const allStepsComplete = [0, 1, 2, 3].every((index) => canAdvanceFromStep(state, index));
  const showReviewShortcut = allStepsComplete && !isReview;
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

  const contextFields: ChipField[] = [
    {
      legend: "Industry",
      question: "What industry are you in?",
      options: INDUSTRY_OPTIONS,
      selected: state.company.industry ? [state.company.industry] : [],
      onSelect: (value) => dispatch({ type: "SET_COMPANY_FIELD", field: "industry", value: value as Industry }),
    },
    {
      legend: "Country",
      question: "Where are you headquartered?",
      options: COUNTRY_OPTIONS,
      selected: state.company.country ? [state.company.country] : [],
      onSelect: (value) => dispatch({ type: "SET_COMPANY_FIELD", field: "country", value: value as Country }),
    },
    {
      legend: "Employees",
      question: "How many employees?",
      options: EMPLOYEE_OPTIONS,
      selected: state.company.employees ? [state.company.employees] : [],
      onSelect: (value) => dispatch({ type: "SET_COMPANY_FIELD", field: "employees", value: value as EmployeeBand }),
    },
    {
      legend: "Revenue",
      question: "What's your revenue?",
      options: REVENUE_OPTIONS,
      selected: state.company.revenue ? [state.company.revenue] : [],
      onSelect: (value) => dispatch({ type: "SET_COMPANY_FIELD", field: "revenue", value: value as RevenueBand }),
    },
    {
      legend: "IT org size",
      question: "How large is your IT organization?",
      options: IT_ORG_SIZE_OPTIONS,
      selected: state.company.itOrgSize ? [state.company.itOrgSize] : [],
      onSelect: (value) => dispatch({ type: "SET_COMPANY_FIELD", field: "itOrgSize", value: value as ItOrgSizeBand }),
    },
    {
      legend: "ERP",
      question: "What ERP do you run today?",
      options: ERP_OPTIONS,
      selected: state.landscape.erp ? [state.landscape.erp] : [],
      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "erp", value: value as ErpSystem }),
    },
    {
      legend: "CRM",
      question: "And your CRM?",
      options: CRM_OPTIONS,
      selected: state.landscape.crm ? [state.landscape.crm] : [],
      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "crm", value: value as CrmSystem }),
    },
    {
      legend: "Analytics",
      question: "What do you use for analytics?",
      options: ANALYTICS_OPTIONS,
      selected: state.landscape.analytics ? [state.landscape.analytics] : [],
      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "analytics", value: value as AnalyticsTool }),
    },
    {
      legend: "Data warehouse",
      question: "Any data warehouse in place?",
      options: DATA_WAREHOUSE_OPTIONS,
      selected: state.landscape.dataWarehouse ? [state.landscape.dataWarehouse] : [],
      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "dataWarehouse", value: value as DataWarehouseSystem }),
    },
    {
      legend: "Cloud",
      question: "Which cloud are you on?",
      options: CLOUD_OPTIONS,
      selected: state.landscape.cloud ? [state.landscape.cloud] : [],
      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "cloud", value: value as CloudProvider }),
    },
    {
      legend: "AI platform",
      question: "Any AI platform in place yet?",
      options: AI_PLATFORM_OPTIONS,
      selected: state.landscape.aiPlatform ? [state.landscape.aiPlatform] : [],
      onSelect: (value) => dispatch({ type: "SET_LANDSCAPE_FIELD", field: "aiPlatform", value: value as AiPlatform }),
    },
  ];

  const priorityFields: ChipField[] = [
    {
      legend: "Goals",
      question: "What matters most?",
      options: GOAL_OPTIONS,
      selected: state.goals.goals,
      multiple: true,
      onSelect: (value) => dispatch({ type: "TOGGLE_GOAL", value: value as GoalTag }),
    },
  ];

  const constraintFields: ChipField[] = [
    {
      legend: "Budget",
      question: "What's your budget level?",
      options: BUDGET_OPTIONS,
      selected: state.constraints.budget ? [state.constraints.budget] : [],
      onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "budget", value: value as BudgetLevel }),
    },
    {
      legend: "Timeline",
      question: "What's your timeline?",
      options: TIMELINE_OPTIONS,
      selected: state.constraints.timeline ? [state.constraints.timeline] : [],
      onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "timeline", value: value as TimelineLevel }),
    },
    {
      legend: "Risk appetite",
      question: "How would you describe your risk appetite?",
      options: RISK_APPETITE_OPTIONS,
      selected: state.constraints.riskAppetite ? [state.constraints.riskAppetite] : [],
      onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "riskAppetite", value: value as RiskAppetite }),
    },
    {
      legend: "Preferred cloud",
      question: "Any preferred cloud?",
      options: PREFERRED_CLOUD_OPTIONS,
      selected: state.constraints.preferredCloud ? [state.constraints.preferredCloud] : [],
      onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "preferredCloud", value: value as PreferredCloud }),
    },
    {
      legend: "Preferred vendor",
      question: sapPresent ? "You mentioned SAP is already in place — should that influence the recommendation?" : "Any preferred vendor?",
      options: PREFERRED_VENDOR_OPTIONS,
      selected: state.constraints.preferredVendor ? [state.constraints.preferredVendor] : [],
      onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "preferredVendor", value: value as PreferredVendor }),
    },
    {
      legend: "Internal skills",
      question: "How strong are your internal skills for this?",
      options: INTERNAL_SKILLS_OPTIONS,
      selected: state.constraints.internalSkills ? [state.constraints.internalSkills] : [],
      onSelect: (value) => dispatch({ type: "SET_CONSTRAINT_FIELD", field: "internalSkills", value: value as InternalSkills }),
    },
  ];

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
              <p className="text-sm font-medium text-nova-accent-strong">Let&apos;s get to know your world.</p>
              <h3 ref={headingRef} tabIndex={-1} className="mt-2 text-2xl font-semibold text-nova-ink outline-none">
                Tell Donna about your company and landscape
              </h3>

              <div className="mt-6">
                <ConversationalFieldFlow
                  stageKey="context"
                  fields={contextFields}
                  note={state.landscape.note}
                  onNoteChange={(value) => {
                    // Both notes exist on WizardState independently; the
                    // single conversational note step at the end of
                    // Context writes to landscape's (the later, more
                    // specific one) — company's stays available for
                    // ReviewStep's own display/edit path unaffected.
                    dispatch({ type: "SET_NOTE", step: "landscape", value });
                  }}
                  noteLabel="Anything else Donna should know about your company or landscape? (optional)"
                  notePlaceholder={
                    isFinancialServices
                      ? "e.g. regulatory requirements (FINMA, GDPR, DORA) that should shape the recommendation..."
                      : "e.g. recently merged with a European subsidiary, BW scheduled for decommission..."
                  }
                />
              </div>
            </div>
          )}

          {state.stepIndex === 2 && (
            <div>
              <p className="text-sm font-medium text-nova-accent-strong">Now, what are you trying to achieve?</p>
              <h3 ref={headingRef} tabIndex={-1} className="mt-2 text-2xl font-semibold text-nova-ink outline-none">
                Your priorities
              </h3>
              <div className="mt-6">
                <ConversationalFieldFlow
                  stageKey="priorities"
                  fields={priorityFields}
                  note={state.goals.note}
                  onNoteChange={(value) => dispatch({ type: "SET_NOTE", step: "goals", value })}
                  noteLabel="Anything Donna should know? (optional)"
                  notePlaceholder="e.g. the board wants results within 12 months..."
                />
              </div>
            </div>
          )}

          {state.stepIndex === 3 && (
            <div>
              <p className="text-sm font-medium text-nova-accent-strong">Last thing.</p>
              <h3 ref={headingRef} tabIndex={-1} className="mt-2 text-2xl font-semibold text-nova-ink outline-none">
                Your constraints
              </h3>
              <div className="mt-6">
                <ConversationalFieldFlow
                  stageKey="constraints"
                  fields={constraintFields}
                  note={state.constraints.note}
                  onNoteChange={(value) => dispatch({ type: "SET_NOTE", step: "constraints", value })}
                  noteLabel="Anything else Donna should know? (optional)"
                  notePlaceholder={
                    sapPresent ? "e.g. how much should the existing SAP investment weigh in?" : "e.g. procurement requires two vendor quotes..."
                  }
                />
              </div>
            </div>
          )}

          {isReview && <ReviewStep ref={headingRef} state={state} onEditStep={(index) => dispatch({ type: "GOTO_STEP", index })} />}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-titanium pt-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={state.stepIndex === 0}
            className="flex min-h-11 items-center gap-1.5 px-1 text-sm font-medium text-nova-ink-muted transition-colors duration-control hover:text-nova-ink disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <div className="flex items-center gap-4">
            {showReviewShortcut && (
              <button
                type="button"
                onClick={() => dispatch({ type: "GOTO_STEP", index: REVIEW_STEP_INDEX })}
                className="flex min-h-11 items-center px-1 text-sm font-medium text-nova-accent-strong transition-colors duration-control hover:text-nova-ink"
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

        {!canAdvance && !isReview && <p className="mt-3 text-right text-xs text-nova-ink-faint">Answer every question to continue.</p>}
      </div>
    </div>
  );
}
