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
import { ChipStep } from "./ChipStep";
import { ReviewStep } from "./ReviewStep";
import { WizardProgress } from "./WizardProgress";

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

  const canAdvance = canAdvanceFromStep(state, state.stepIndex);
  const isReview = state.stepIndex === REVIEW_STEP_INDEX;
  const allStepsComplete = [0, 1, 2, 3].every((index) => canAdvanceFromStep(state, index));
  const showReviewShortcut = allStepsComplete && !isReview;
  const isMultiSelectStep = state.stepIndex === 2;

  return (
    <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
      <aside className="rounded-[2rem] border border-slate-200/80 bg-white/75 p-6 shadow-[0_30px_90px_-45px_rgba(79,70,229,0.3)] backdrop-blur-xl lg:sticky lg:top-6 lg:self-start">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-200">
            <Sparkles size={19} />
          </div>
          <div>
            <div className="font-semibold text-slate-950">Donna AI</div>
            <div className="text-xs text-slate-500">Enterprise decision assistant</div>
          </div>
        </div>

        <div className="mt-7">
          <WizardProgress stepIndex={state.stepIndex} />
        </div>

        {state.stepIndex === 0 && (
          <button
            type="button"
            onClick={() => dispatch({ type: "LOAD_SAMPLE" })}
            className="mt-7 w-full rounded-xl border border-dashed border-violet-200 bg-violet-50/60 px-3.5 py-3 text-left text-sm font-medium text-violet-700 transition hover:bg-violet-50"
          >
            Try a sample company
            <span className="mt-1 block text-xs font-normal text-violet-500">
              Pre-fills every step so you can preview a full result.
            </span>
          </button>
        )}
      </aside>

      <div className="rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_40px_110px_-45px_rgba(79,70,229,0.4)] backdrop-blur-2xl sm:p-8">
        <div key={state.stepIndex} className="animate-in fade-in slide-in-from-right-2 duration-300">
          {state.stepIndex === 0 && (
            <ChipStep
              ref={headingRef}
              prompt="To find the right fit, tell me a bit about your company first."
              title="Tell Donna about your company"
              fields={[
                {
                  legend: "Industry",
                  options: INDUSTRY_OPTIONS,
                  selected: state.company.industry ? [state.company.industry] : [],
                  onSelect: (value) =>
                    dispatch({ type: "SET_COMPANY_FIELD", field: "industry", value: value as Industry }),
                },
                {
                  legend: "Country",
                  options: COUNTRY_OPTIONS,
                  selected: state.company.country ? [state.company.country] : [],
                  onSelect: (value) =>
                    dispatch({ type: "SET_COMPANY_FIELD", field: "country", value: value as Country }),
                },
                {
                  legend: "Employees",
                  options: EMPLOYEE_OPTIONS,
                  selected: state.company.employees ? [state.company.employees] : [],
                  onSelect: (value) =>
                    dispatch({ type: "SET_COMPANY_FIELD", field: "employees", value: value as EmployeeBand }),
                },
                {
                  legend: "Revenue",
                  options: REVENUE_OPTIONS,
                  selected: state.company.revenue ? [state.company.revenue] : [],
                  onSelect: (value) =>
                    dispatch({ type: "SET_COMPANY_FIELD", field: "revenue", value: value as RevenueBand }),
                },
                {
                  legend: "IT organization size",
                  options: IT_ORG_SIZE_OPTIONS,
                  selected: state.company.itOrgSize ? [state.company.itOrgSize] : [],
                  onSelect: (value) =>
                    dispatch({ type: "SET_COMPANY_FIELD", field: "itOrgSize", value: value as ItOrgSizeBand }),
                },
              ]}
              note={state.company.note}
              onNoteChange={(value) => dispatch({ type: "SET_NOTE", step: "company", value })}
              noteLabel="Anything else about your company? (optional)"
              notePlaceholder="e.g. recently merged with a European subsidiary..."
            />
          )}

          {state.stepIndex === 1 && (
            <ChipStep
              ref={headingRef}
              prompt="Great — now, what does your current landscape look like?"
              title="Your current landscape"
              fields={[
                {
                  legend: "ERP",
                  options: ERP_OPTIONS,
                  selected: state.landscape.erp ? [state.landscape.erp] : [],
                  onSelect: (value) =>
                    dispatch({ type: "SET_LANDSCAPE_FIELD", field: "erp", value: value as ErpSystem }),
                },
                {
                  legend: "CRM",
                  options: CRM_OPTIONS,
                  selected: state.landscape.crm ? [state.landscape.crm] : [],
                  onSelect: (value) =>
                    dispatch({ type: "SET_LANDSCAPE_FIELD", field: "crm", value: value as CrmSystem }),
                },
                {
                  legend: "Analytics",
                  options: ANALYTICS_OPTIONS,
                  selected: state.landscape.analytics ? [state.landscape.analytics] : [],
                  onSelect: (value) =>
                    dispatch({ type: "SET_LANDSCAPE_FIELD", field: "analytics", value: value as AnalyticsTool }),
                },
                {
                  legend: "Data warehouse",
                  options: DATA_WAREHOUSE_OPTIONS,
                  selected: state.landscape.dataWarehouse ? [state.landscape.dataWarehouse] : [],
                  onSelect: (value) =>
                    dispatch({
                      type: "SET_LANDSCAPE_FIELD",
                      field: "dataWarehouse",
                      value: value as DataWarehouseSystem,
                    }),
                },
                {
                  legend: "Cloud",
                  options: CLOUD_OPTIONS,
                  selected: state.landscape.cloud ? [state.landscape.cloud] : [],
                  onSelect: (value) =>
                    dispatch({ type: "SET_LANDSCAPE_FIELD", field: "cloud", value: value as CloudProvider }),
                },
                {
                  legend: "AI platform",
                  options: AI_PLATFORM_OPTIONS,
                  selected: state.landscape.aiPlatform ? [state.landscape.aiPlatform] : [],
                  onSelect: (value) =>
                    dispatch({
                      type: "SET_LANDSCAPE_FIELD",
                      field: "aiPlatform",
                      value: value as AiPlatform,
                    }),
                },
              ]}
              note={state.landscape.note}
              onNoteChange={(value) => dispatch({ type: "SET_NOTE", step: "landscape", value })}
              noteLabel="Anything else about your landscape? (optional)"
              notePlaceholder="e.g. BW is scheduled for decommission next year..."
            />
          )}

          {state.stepIndex === 2 && (
            <ChipStep
              ref={headingRef}
              prompt="What are you trying to achieve?"
              title="Your business goals"
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
              noteLabel="Anything else about your goals? (optional)"
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
                  onSelect: (value) =>
                    dispatch({ type: "SET_CONSTRAINT_FIELD", field: "budget", value: value as BudgetLevel }),
                },
                {
                  legend: "Timeline",
                  options: TIMELINE_OPTIONS,
                  selected: state.constraints.timeline ? [state.constraints.timeline] : [],
                  onSelect: (value) =>
                    dispatch({ type: "SET_CONSTRAINT_FIELD", field: "timeline", value: value as TimelineLevel }),
                },
                {
                  legend: "Risk appetite",
                  options: RISK_APPETITE_OPTIONS,
                  selected: state.constraints.riskAppetite ? [state.constraints.riskAppetite] : [],
                  onSelect: (value) =>
                    dispatch({
                      type: "SET_CONSTRAINT_FIELD",
                      field: "riskAppetite",
                      value: value as RiskAppetite,
                    }),
                },
                {
                  legend: "Preferred cloud",
                  options: PREFERRED_CLOUD_OPTIONS,
                  selected: state.constraints.preferredCloud ? [state.constraints.preferredCloud] : [],
                  onSelect: (value) =>
                    dispatch({
                      type: "SET_CONSTRAINT_FIELD",
                      field: "preferredCloud",
                      value: value as PreferredCloud,
                    }),
                },
                {
                  legend: "Preferred vendor",
                  options: PREFERRED_VENDOR_OPTIONS,
                  selected: state.constraints.preferredVendor ? [state.constraints.preferredVendor] : [],
                  onSelect: (value) =>
                    dispatch({
                      type: "SET_CONSTRAINT_FIELD",
                      field: "preferredVendor",
                      value: value as PreferredVendor,
                    }),
                },
                {
                  legend: "Internal skills",
                  options: INTERNAL_SKILLS_OPTIONS,
                  selected: state.constraints.internalSkills ? [state.constraints.internalSkills] : [],
                  onSelect: (value) =>
                    dispatch({
                      type: "SET_CONSTRAINT_FIELD",
                      field: "internalSkills",
                      value: value as InternalSkills,
                    }),
                },
              ]}
              note={state.constraints.note}
              onNoteChange={(value) => dispatch({ type: "SET_NOTE", step: "constraints", value })}
              noteLabel="Anything else Donna should know? (optional)"
              notePlaceholder="e.g. procurement requires two vendor quotes..."
            />
          )}

          {isReview && (
            <ReviewStep
              ref={headingRef}
              state={state}
              onEditStep={(index) => dispatch({ type: "GOTO_STEP", index })}
            />
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={() => dispatch({ type: "BACK" })}
            disabled={state.stepIndex === 0}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900 disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <div className="flex items-center gap-4">
            {showReviewShortcut && (
              <button
                type="button"
                onClick={() => dispatch({ type: "GOTO_STEP", index: REVIEW_STEP_INDEX })}
                className="text-sm font-medium text-violet-700 hover:text-violet-800"
              >
                Back to review
              </button>
            )}

            {isReview ? (
              <Button
                onClick={() => onComplete(state)}
                className="h-11 bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-white"
              >
                Start analysis
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={() => dispatch({ type: "NEXT" })}
                disabled={!canAdvance}
                className="h-11 bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-white"
              >
                Next
                <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>

        {!canAdvance && !isReview && (
          <p className="mt-3 text-right text-xs text-slate-400">
            {isMultiSelectStep ? "Pick at least one to continue." : "Answer every question to continue."}
          </p>
        )}
      </div>
    </div>
  );
}
