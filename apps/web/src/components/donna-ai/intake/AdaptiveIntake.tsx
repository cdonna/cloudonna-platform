"use client";

/**
 * Replaces IntakeWizard as the default entry point into Donna AI.
 * Three phases: a single open question, a brief "did I get that
 * right" confirmation, then an adaptive one-question-at-a-time loop
 * that only asks about fields the confirmation step left unanswered —
 * see question-engine.ts for what "unanswered" and "worth asking"
 * actually mean. Everything this component produces is a real
 * WizardState, built through the exact same wizardReducer actions the
 * old manual wizard used (see apply-candidates.ts) — buildDecisionOutput
 * downstream is completely unaware this component exists.
 *
 * Deliberately does not reuse ConversationalFieldFlow: that component
 * owns a fixed field list and its own "show a note field once the list
 * is exhausted" behavior, neither of which fits a single field whose
 * identity changes after every answer. The one-question-at-a-time
 * visual language (fieldset/legend/Chip options) is intentionally kept
 * consistent with it anyway.
 */
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ArrowRight, Check, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/dictionary";
import { interpolate } from "@/i18n/interpolate";
import { useLocale } from "@/i18n/LocaleProvider";
import { localizedOptionLabel } from "@/i18n/option-labels";
import { Chip } from "../shared";
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
import { wizardReducer } from "../engine";
import type { GoalTag, WizardAction, WizardState } from "../types";
import { applyExtractionResult } from "./apply-candidates";
import { extractFromStatement } from "./deterministic-extractor";
import type { ExtractionFieldKey, ExtractionResult } from "./extraction-types";
import {
  canOfferRecommendation,
  computeDecisionReadiness,
  selectNextQuestion,
  tierForField,
  type QuestionField,
} from "./question-engine";
import {
  persistToSessionStorage,
  pushDonnaHistoryState,
  readCurrentDonnaHistoryState,
  readDonnaHistoryState,
  restoreFromSessionStorage,
} from "../session-history";

type Phase = "opening" | "confirming" | "questions";

const INTAKE_HISTORY_NAMESPACE = "donna-intake";
const INTAKE_SESSION_KEY = "donna-intake-session";

interface FieldMeta {
  legend: string;
  question: string;
  options: Array<{ value: string; label: string }>;
  multiple?: boolean;
  section: "goals" | "company" | "landscape" | "constraints";
  key?: string;
}

const FIELD_OPTIONS: Record<QuestionField, Array<{ value: string; label: string }>> = {
  goals: GOAL_OPTIONS,
  erp: ERP_OPTIONS,
  cloud: CLOUD_OPTIONS,
  dataWarehouse: DATA_WAREHOUSE_OPTIONS,
  employees: EMPLOYEE_OPTIONS,
  industry: INDUSTRY_OPTIONS,
  budget: BUDGET_OPTIONS,
  timeline: TIMELINE_OPTIONS,
  preferredVendor: PREFERRED_VENDOR_OPTIONS,
  preferredCloud: PREFERRED_CLOUD_OPTIONS,
  riskAppetite: RISK_APPETITE_OPTIONS,
  internalSkills: INTERNAL_SKILLS_OPTIONS,
  aiPlatform: AI_PLATFORM_OPTIONS,
  country: COUNTRY_OPTIONS,
  revenue: REVENUE_OPTIONS,
  itOrgSize: IT_ORG_SIZE_OPTIONS,
  crm: CRM_OPTIONS,
  analytics: ANALYTICS_OPTIONS,
};

const FIELD_SECTION: Record<QuestionField, { section: FieldMeta["section"]; key?: string; multiple?: boolean }> = {
  goals: { section: "goals", multiple: true },
  erp: { section: "landscape", key: "erp" },
  cloud: { section: "landscape", key: "cloud" },
  dataWarehouse: { section: "landscape", key: "dataWarehouse" },
  employees: { section: "company", key: "employees" },
  industry: { section: "company", key: "industry" },
  budget: { section: "constraints", key: "budget" },
  timeline: { section: "constraints", key: "timeline" },
  preferredVendor: { section: "constraints", key: "preferredVendor" },
  preferredCloud: { section: "constraints", key: "preferredCloud" },
  riskAppetite: { section: "constraints", key: "riskAppetite" },
  internalSkills: { section: "constraints", key: "internalSkills" },
  aiPlatform: { section: "landscape", key: "aiPlatform" },
  country: { section: "company", key: "country" },
  revenue: { section: "company", key: "revenue" },
  itOrgSize: { section: "company", key: "itOrgSize" },
  crm: { section: "landscape", key: "crm" },
  analytics: { section: "landscape", key: "analytics" },
};

/** Localizes both the question copy (from the dictionary) and every
 * option's display label (from the option-labels override table) —
 * the underlying `value` never changes, so scoring/extraction stay
 * exactly as language-neutral as before. Rebuilt per render off
 * `dict`/`locale` rather than once at module scope, since both are
 * now request-dependent. */
function buildFieldMeta(dict: Dictionary, locale: Parameters<typeof localizedOptionLabel>[3]): Record<QuestionField, FieldMeta> {
  const entries = (Object.keys(FIELD_SECTION) as QuestionField[]).map((field) => {
    const copy = dict.adaptiveIntake.fields[field];
    const options = FIELD_OPTIONS[field].map((option) => ({
      value: option.value,
      label: localizedOptionLabel(field, option.value, option.label, locale),
    }));
    return [field, { legend: copy.legend, question: copy.question, options, ...FIELD_SECTION[field] }] as const;
  });
  return Object.fromEntries(entries) as Record<QuestionField, FieldMeta>;
}

/** The one place a value picked for a dynamically-selected field turns
 * into a typed WizardAction. TypeScript cannot verify the field/value
 * pairing generically across a discriminated union like WizardAction —
 * the cast is safe because `value` only ever comes from that same
 * field's own OPTIONS list (FIELD_OPTIONS[field]), never from
 * arbitrary input. Reads FIELD_SECTION directly rather than the
 * per-render, dictionary-localized FIELD_META — section/key never
 * change with locale. */
function buildFieldAction(field: QuestionField, value: string): WizardAction {
  const meta = FIELD_SECTION[field];
  if (meta.section === "goals") return { type: "TOGGLE_GOAL", value: value as GoalTag };
  if (meta.section === "company") return { type: "SET_COMPANY_FIELD", field: meta.key, value } as unknown as WizardAction;
  if (meta.section === "landscape") return { type: "SET_LANDSCAPE_FIELD", field: meta.key, value } as unknown as WizardAction;
  return { type: "SET_CONSTRAINT_FIELD", field: meta.key, value } as unknown as WizardAction;
}

function selectedValuesFor(state: WizardState, field: QuestionField): string[] {
  const meta = FIELD_SECTION[field];
  if (meta.section === "goals") return state.goals.goals;
  const value =
    meta.section === "company"
      ? state.company[meta.key as keyof WizardState["company"]]
      : meta.section === "landscape"
        ? state.landscape[meta.key as keyof WizardState["landscape"]]
        : state.constraints[meta.key as keyof WizardState["constraints"]];
  return typeof value === "string" ? [value] : [];
}

interface IntakeSnapshot {
  phase: Phase;
  statement: string;
  extraction: ExtractionResult | null;
  acceptedKeys: ExtractionFieldKey[];
  acceptedGoals: GoalTag[];
  wizardState: WizardState;
  includeSecondary: boolean;
  activeField: QuestionField | null;
}

function loadInitialIntakeSnapshot(): IntakeSnapshot {
  const fromHistory = readCurrentDonnaHistoryState<IntakeSnapshot>(INTAKE_HISTORY_NAMESPACE);
  const restored = fromHistory ?? restoreFromSessionStorage<IntakeSnapshot>(INTAKE_SESSION_KEY);
  return (
    restored ?? {
      phase: "opening",
      statement: "",
      extraction: null,
      acceptedKeys: [],
      acceptedGoals: [],
      wizardState: EMPTY_WIZARD_STATE,
      includeSecondary: false,
      activeField: null,
    }
  );
}

export function AdaptiveIntake({ onComplete }: { onComplete: (state: WizardState) => void }) {
  const { dict, locale } = useLocale();
  const fieldMeta = useMemo(() => buildFieldMeta(dict, locale), [dict, locale]);
  const initial = useState(loadInitialIntakeSnapshot)[0];
  const [phase, setPhase] = useState<Phase>(initial.phase);
  const [statement, setStatement] = useState(initial.statement);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(initial.extraction);
  const [acceptedKeys, setAcceptedKeys] = useState<Set<ExtractionFieldKey>>(new Set(initial.acceptedKeys));
  const [acceptedGoals, setAcceptedGoals] = useState<Set<GoalTag>>(new Set(initial.acceptedGoals));
  const [state, dispatch] = useReducer(wizardReducer, initial.wizardState);
  const [includeSecondary, setIncludeSecondary] = useState(initial.includeSecondary);
  // Real state, not derived from `state` on every render — deliberately.
  // A multi-select field (goals) must stay on screen after the first
  // pick until the user explicitly continues, per the brief's own "do
  // not auto-advance on a multi-select" rule; a pure `selectNextQuestion(state)`
  // derivation would move on the instant `goals.length` goes from 0 to
  // 1, which was the actual bug. Only ever set from event handlers
  // below (never from a useEffect watching state), so this stays
  // consistent with the "don't sync state via effects" discipline the
  // rest of this component already follows.
  const [activeField, setActiveField] = useState<QuestionField | null>(initial.activeField);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [phase, activeField]);

  /** Every meaningful step (not every keystroke — see the textarea's
   * plain onChange below) goes through here, so a pushed history entry
   * and the persisted sessionStorage snapshot never disagree with what
   * every individual setter above just did. Values are passed
   * explicitly rather than read back from state, since React state
   * setters are async — reading `state`/`phase` etc. right after
   * calling their setters would still see the pre-update values. */
  function commitStep(next: IntakeSnapshot, options: { recordHistory?: boolean } = {}) {
    const { recordHistory = true } = options;
    persistToSessionStorage(INTAKE_SESSION_KEY, next);
    if (recordHistory) pushDonnaHistoryState(INTAKE_HISTORY_NAMESPACE, next);
  }

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const restored = readDonnaHistoryState<IntakeSnapshot>(event, INTAKE_HISTORY_NAMESPACE);
      if (!restored) return; // a different namespace (DonnaAIExperience's own), or before this began
      setPhase(restored.phase);
      setStatement(restored.statement);
      setExtraction(restored.extraction);
      setAcceptedKeys(new Set(restored.acceptedKeys));
      setAcceptedGoals(new Set(restored.acceptedGoals));
      dispatch({ type: "RESTORE", state: restored.wizardState });
      setIncludeSecondary(restored.includeSecondary);
      setActiveField(restored.activeField);
      persistToSessionStorage(INTAKE_SESSION_KEY, restored);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function handleExtract() {
    const cleaned = statement.trim();
    if (!cleaned) return;
    const result = extractFromStatement(cleaned);
    const keys = new Set<ExtractionFieldKey>(
      (Object.keys(result.candidates) as ExtractionFieldKey[]).filter((key) => !result.candidates[key]?.requiresConfirmation),
    );
    const goals = new Set<GoalTag>(result.goals.filter((g) => !g.requiresConfirmation).map((g) => g.value));
    setExtraction(result);
    setAcceptedKeys(keys);
    setAcceptedGoals(goals);
    setPhase("confirming");
    commitStep({
      phase: "confirming",
      statement,
      extraction: result,
      acceptedKeys: [...keys],
      acceptedGoals: [...goals],
      wizardState: state,
      includeSecondary,
      activeField: null,
    });
  }

  function handleSkipToQuestions() {
    const next = selectNextQuestion(state, { includeSecondary });
    setExtraction(null);
    setActiveField(next);
    setPhase("questions");
    commitStep({ phase: "questions", statement, extraction: null, acceptedKeys: [], acceptedGoals: [], wizardState: state, includeSecondary, activeField: next });
  }

  function toggleAccepted(key: ExtractionFieldKey) {
    setAcceptedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGoalAccepted(goal: GoalTag) {
    setAcceptedGoals((current) => {
      const next = new Set(current);
      if (next.has(goal)) next.delete(goal);
      else next.add(goal);
      return next;
    });
  }

  function handleConfirm() {
    if (!extraction) {
      const next = selectNextQuestion(state, { includeSecondary });
      setActiveField(next);
      setPhase("questions");
      commitStep({ phase: "questions", statement, extraction: null, acceptedKeys: [], acceptedGoals: [], wizardState: state, includeSecondary, activeField: next });
      return;
    }
    const merged = applyExtractionResult(state, extraction, acceptedKeys, acceptedGoals);
    dispatch({ type: "RESTORE", state: merged });
    const next = selectNextQuestion(merged, { includeSecondary });
    setActiveField(next);
    setPhase("questions");
    commitStep({
      phase: "questions",
      statement,
      extraction,
      acceptedKeys: [...acceptedKeys],
      acceptedGoals: [...acceptedGoals],
      wizardState: merged,
      includeSecondary,
      activeField: next,
    });
  }

  function handleAddMoreContext() {
    const next = selectNextQuestion(state, { includeSecondary: true });
    setIncludeSecondary(true);
    setActiveField(next);
    commitStep({ phase, statement, extraction, acceptedKeys: [...acceptedKeys], acceptedGoals: [...acceptedGoals], wizardState: state, includeSecondary: true, activeField: next });
  }

  function handleFieldSelect(field: QuestionField, value: string) {
    const action = buildFieldAction(field, value);
    dispatch(action);
    if (FIELD_SECTION[field].multiple) return; // multi-select never auto-advances — Continue does
    // wizardReducer is pure — computing the post-action state directly
    // (rather than reading the pre-dispatch `state` closure, which
    // React hasn't updated yet) is what makes auto-advance land on the
    // actually-next field instead of one render behind.
    const nextState = wizardReducer(state, action);
    const next = selectNextQuestion(nextState, { includeSecondary });
    setActiveField(next);
    commitStep({ phase, statement, extraction, acceptedKeys: [...acceptedKeys], acceptedGoals: [...acceptedGoals], wizardState: nextState, includeSecondary, activeField: next });
  }

  function handleMultiSelectContinue() {
    const next = selectNextQuestion(state, { includeSecondary });
    setActiveField(next);
    commitStep({ phase, statement, extraction, acceptedKeys: [...acceptedKeys], acceptedGoals: [...acceptedGoals], wizardState: state, includeSecondary, activeField: next });
  }

  const readiness = useMemo(() => computeDecisionReadiness(state), [state]);
  const canRecommend = canOfferRecommendation(state);

  if (phase === "opening") {
    return (
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-titanium bg-carbon p-6 shadow-nova-raised sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-nova-accent text-white shadow-nova-glow">
          <Sparkles size={24} />
        </div>
        <h2 ref={headingRef} tabIndex={-1} className="mt-6 text-center text-2xl font-semibold text-nova-ink outline-none sm:text-3xl">
          {dict.adaptiveIntake.openingHeading}
        </h2>
        <p className="mt-3 text-center text-sm leading-6 text-nova-ink-faint">{dict.adaptiveIntake.openingSub}</p>

        <label htmlFor="intake-statement" className="sr-only">
          {dict.adaptiveIntake.statementSrLabel}
        </label>
        <textarea
          id="intake-statement"
          value={statement}
          onChange={(event) => setStatement(event.target.value)}
          rows={5}
          placeholder={dict.adaptiveIntake.statementPlaceholder}
          className="mt-7 w-full resize-none rounded-2xl border border-titanium bg-carbon-2 px-4 py-3.5 text-sm leading-6 text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
        />

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleSkipToQuestions}
            className="flex min-h-11 items-center px-1 text-sm font-medium text-nova-ink-faint transition-colors duration-control hover:text-nova-ink"
          >
            {dict.adaptiveIntake.skipLink}
          </button>
          <Button onClick={handleExtract} disabled={!statement.trim()} className="h-12 bg-nova-accent px-7 text-white shadow-nova-glow hover:bg-nova-accent-strong">
            {dict.adaptiveIntake.continueBtn}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "confirming" && extraction) {
    const fieldEntries = (Object.keys(extraction.candidates) as ExtractionFieldKey[])
      .map((key) => ({ key, field: extraction.candidates[key]! }))
      .filter((entry) => entry.field !== undefined);
    const said = fieldEntries.filter((entry) => entry.field.source === "user_statement");
    const inferred = fieldEntries.filter((entry) => entry.field.source === "inferred");
    const inferredGoals = extraction.goals.filter((g) => g.requiresConfirmation);
    const saidGoals = extraction.goals.filter((g) => !g.requiresConfirmation);
    const goalLabel = (value: GoalTag) => fieldMeta.goals.options.find((o) => o.value === value)?.label ?? value;

    return (
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-titanium bg-carbon p-6 shadow-nova-raised sm:p-10">
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-nova-ink outline-none">
          {dict.adaptiveIntake.understoodHeading}
        </h2>
        <p className="mt-2 text-sm leading-6 text-nova-ink-faint">{dict.adaptiveIntake.understoodSub}</p>

        {(said.length > 0 || saidGoals.length > 0) && (
          <div className="mt-6">
            <div className="text-xs font-semibold tracking-[0.1em] text-nova-ink-faint uppercase">{dict.adaptiveIntake.youSaid}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {said.map(({ key, field }) => (
                <UnderstoodPill key={key} label={labelFor(dict, fieldMeta, key, field.value, field.rawText)} accepted={acceptedKeys.has(key)} onToggle={() => toggleAccepted(key)} />
              ))}
              {saidGoals.map((g) => (
                <UnderstoodPill
                  key={g.value}
                  label={goalLabel(g.value)}
                  accepted={acceptedGoals.has(g.value)}
                  onToggle={() => toggleGoalAccepted(g.value)}
                />
              ))}
            </div>
          </div>
        )}

        {(inferred.length > 0 || inferredGoals.length > 0) && (
          <div className="mt-6">
            <div className="text-xs font-semibold tracking-[0.1em] text-nova-accent-strong uppercase">{dict.adaptiveIntake.donnaInferred}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {inferred.map(({ key, field }) => (
                <UnderstoodPill key={key} label={labelFor(dict, fieldMeta, key, field.value, field.rawText)} accepted={acceptedKeys.has(key)} onToggle={() => toggleAccepted(key)} tentative />
              ))}
              {inferredGoals.map((g) => (
                <UnderstoodPill
                  key={g.value}
                  label={goalLabel(g.value)}
                  accepted={acceptedGoals.has(g.value)}
                  onToggle={() => toggleGoalAccepted(g.value)}
                  tentative
                />
              ))}
            </div>
          </div>
        )}

        {extraction.additionalSystems.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-semibold tracking-[0.1em] text-nova-ink-faint uppercase">{dict.adaptiveIntake.alsoMentioned}</div>
            <p className="mt-1 text-xs text-nova-ink-faint">{dict.adaptiveIntake.alsoMentionedNote}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {extraction.additionalSystems.map((system) => (
                <span
                  key={`${system.category}-${system.value}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-titanium bg-carbon-2 px-3.5 py-2 text-sm font-medium text-nova-ink-muted"
                >
                  <Check size={13} className="text-nova-ink-faint" />
                  {localizedOptionLabel(system.category, system.value, system.label, locale)}
                </span>
              ))}
            </div>
          </div>
        )}

        {said.length === 0 &&
          saidGoals.length === 0 &&
          inferred.length === 0 &&
          inferredGoals.length === 0 &&
          extraction.additionalSystems.length === 0 && (
          <p className="mt-6 rounded-xl border border-dashed border-titanium bg-carbon-2 p-4 text-sm text-nova-ink-faint">
            {dict.adaptiveIntake.nothingExtracted}
          </p>
        )}

        <div className="mt-8 flex justify-end">
          <Button onClick={handleConfirm} className="h-11 bg-nova-accent px-6 text-white shadow-nova-glow hover:bg-nova-accent-strong">
            {dict.adaptiveIntake.confirmBtn}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "questions") {
    const meta = activeField ? fieldMeta[activeField] : null;
    const selectedForActive = activeField ? selectedValuesFor(state, activeField) : [];
    // Once Donna has enough to recommend, the primary path becomes
    // "Get recommendation" — remaining questions (if any) stop being
    // forced and become an explicit opt-in instead. This is the direct
    // fix for "Donna should not visually pressure the user through more
    // questions" once ready: the question UI and the ready UI are now
    // mutually exclusive, never stacked in the same screen.
    const showReady = canRecommend && !includeSecondary;

    return (
      <div className="mx-auto max-w-2xl rounded-[2rem] border border-titanium bg-carbon p-6 shadow-nova-raised sm:p-10">
        {!showReady && (
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon-2 px-3 py-1.5 text-xs font-medium text-nova-ink-faint">
              {dict.questionEngine.readinessLabels[readiness]}
            </span>
            {activeField && (
              <span className="text-xs text-nova-ink-faint">{dict.questionEngine.tierLabels[tierForField(activeField)]}</span>
            )}
          </div>
        )}

        {showReady ? (
          <div className="mt-2 text-center motion-safe:animate-in motion-safe:fade-in duration-panel ease-nova-settle">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-nova-success/10 text-nova-success">
              <Check size={24} />
            </div>
            <h2 ref={headingRef} tabIndex={-1} className="mt-5 text-xl font-semibold text-nova-ink outline-none">
              {dict.adaptiveIntake.readyHeading}
            </h2>
            <p className="mt-2 text-sm text-nova-ink-faint">{dict.questionEngine.readinessLabels[readiness]}.</p>
            <Button onClick={() => onComplete(state)} className="mt-6 h-12 bg-nova-accent px-7 text-white shadow-nova-glow hover:bg-nova-accent-strong">
              {dict.adaptiveIntake.getRecommendation}
              <ArrowRight size={16} />
            </Button>
            <div>
              <button
                type="button"
                onClick={handleAddMoreContext}
                className="mt-4 inline-flex min-h-11 items-center px-1 text-sm font-medium text-nova-ink-faint transition-colors duration-control hover:text-nova-ink"
              >
                {dict.adaptiveIntake.addMoreContext}
              </button>
            </div>
          </div>
        ) : meta && activeField ? (
          <div key={activeField} className="mt-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 duration-panel ease-nova-settle">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-nova-ink outline-none">
              {meta.question}
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {meta.options.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={selectedForActive.includes(option.value)}
                  onClick={() => handleFieldSelect(activeField, option.value)}
                />
              ))}
            </div>
            {meta.multiple && (
              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-xs text-nova-ink-faint">{dict.adaptiveIntake.pickAsManyApply}</p>
                <Button
                  onClick={handleMultiSelectContinue}
                  disabled={selectedForActive.length === 0}
                  variant="outline"
                  className="h-10 border-titanium bg-carbon-2 px-5 text-nova-ink hover:border-titanium-strong"
                >
                  {dict.adaptiveIntake.continueBtn}
                  <ArrowRight size={15} />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold text-nova-ink outline-none">
              {dict.adaptiveIntake.everythingUsedHeading}
            </h2>
            <p className="mt-2 text-sm text-nova-ink-faint">{dict.adaptiveIntake.everythingUsedSub}</p>
          </div>
        )}

        {!showReady && (
          <div className="mt-8 flex justify-end border-t border-titanium pt-6">
            <Button
              onClick={() => onComplete(state)}
              disabled={!canRecommend}
              className="h-12 bg-nova-accent px-7 text-white shadow-nova-glow hover:bg-nova-accent-strong"
            >
              {dict.adaptiveIntake.getRecommendation}
              <ArrowRight size={16} />
            </Button>
          </div>
        )}

        {!showReady && !canRecommend && (
          <p className="mt-3 text-right text-xs text-nova-ink-faint">{dict.adaptiveIntake.moreContextHint}</p>
        )}
      </div>
    );
  }

  return null;
}

/** Shows the user's own higher-fidelity words alongside the normalized
 * scoring band whenever the extractor captured one (currently just
 * `employees` — "around 4,000" next to "2,000–10,000") — the coarse
 * category is real and needed for scoring, but it is never allowed to
 * *replace* what the user actually said. See rawText on ExtractedField.
 * Reads option labels and the field legend from `fieldMeta` — already
 * localized (see buildFieldMeta) — rather than the raw English
 * OPTIONS arrays, so this pill's text matches the active locale too. */
function labelFor(dict: Dictionary, fieldMeta: Record<QuestionField, FieldMeta>, key: ExtractionFieldKey, value: unknown, rawText?: string): string {
  const meta = fieldMeta[key as QuestionField];
  const bandLabel = meta?.options.find((option) => option.value === value)?.label ?? String(value);
  const fieldLabel = meta?.legend ?? key;
  if (rawText) return interpolate(dict.adaptiveIntake.rawTextLabel, { field: fieldLabel, rawText, band: bandLabel });
  return interpolate(dict.adaptiveIntake.bandLabel, { field: fieldLabel, band: bandLabel });
}

/**
 * Three real states, each with its own look — never "everything
 * unaccepted looks rejected." A "said" pill starts accepted (checked,
 * green) because a high-confidence match genuinely is what the user
 * said; toggling it off is a real removal (muted, struck through, X).
 * An "inferred" pill starts unaccepted but must never look rejected —
 * it's a suggestion awaiting a decision, shown as a dashed, actionable
 * invitation (violet, plus icon) until tapped, at which point it looks
 * exactly like an accepted fact (violet check). This was the literal
 * bug reported: inferred pills rendered indistinguishably from removed
 * ones on first paint.
 */
function UnderstoodPill({
  label,
  accepted,
  onToggle,
  tentative = false,
}: {
  label: string;
  accepted: boolean;
  onToggle: () => void;
  tentative?: boolean;
}) {
  if (tentative && !accepted) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={false}
        className="flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-nova-accent/50 bg-transparent px-3.5 py-2 text-sm font-medium text-nova-accent-strong outline-none transition-colors duration-control hover:bg-nova-accent/10 focus-visible:ring-3 focus-visible:ring-nova-accent/40 active:scale-95"
      >
        <Plus size={13} />
        {label}
      </button>
    );
  }

  const removed = !tentative && !accepted;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={accepted}
      className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium outline-none transition-colors duration-control focus-visible:ring-3 focus-visible:ring-nova-accent/40 active:scale-95 ${
        removed
          ? "border-titanium bg-carbon-2 text-nova-ink-faint line-through"
          : tentative
            ? "border-nova-accent/40 bg-nova-accent/10 text-nova-accent-strong"
            : "border-nova-success/30 bg-nova-success/10 text-nova-success"
      }`}
    >
      {removed ? <X size={13} /> : <Check size={13} />}
      {label}
    </button>
  );
}
