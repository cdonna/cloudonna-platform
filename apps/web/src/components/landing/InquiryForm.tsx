"use client";

/**
 * The one inquiry form implementation on the entire public site — the
 * homepage Founding Testers section, /contact, and /early-access all
 * render this component with a different `inquiryType`, and all three
 * post to the same /api/inquiries backend. Replaces the previous
 * EarlyAccess component's simulated submission (a setTimeout, nothing
 * transmitted or stored — see its own prior disclosed copy) with a
 * real, persisted one. See docs/operations/01-business-operations.md.
 */
import { useEffect, useId, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";

import { Display, Eyebrow, Lede, Shell } from "@/components/editorial/primitives";
import { useLocale } from "@/i18n/LocaleProvider";
import { getAnalyticsProvider } from "@/lib/analytics/config";
import type { InquiryType } from "@/lib/inquiries/schema";

const SUBMITTED_EVENT_BY_TYPE: Partial<Record<InquiryType, string>> = {
  founding_tester: "founding_tester_submitted",
  partner: "partner_inquiry_submitted",
  vendor: "vendor_inquiry_submitted",
};

export function InquiryForm({
  inquiryType,
  sectionId,
  register = "light",
}: {
  inquiryType: InquiryType;
  sectionId?: string;
  /** The form is register-relative: every colour below resolves against
   * whichever register it sits in, so the dark homepage closing section
   * and the light /contact page share one implementation. */
  register?: "light" | "dark";
}) {
  const { dict } = useLocale();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formId = useId();
  const copy = dict.inquiryForm.copyByType[inquiryType];
  const roles = dict.inquiryForm.roles;

  useEffect(() => {
    getAnalyticsProvider().trackEvent({ name: "inquiry_started", properties: { inquiryType } });
    // Only on mount for this specific inquiryType — not on every
    // re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const trim = (key: string) => (form.get(key) as string | null)?.trim() || undefined;
    // Read directly from window rather than next/navigation's
    // useSearchParams()/usePathname() hooks — those require a Suspense
    // boundary for static generation, which this component (rendered
    // in a statically-generated homepage) doesn't have. A plain client-
    // side read inside this event handler needs no such boundary: it
    // only ever runs after hydration, in response to a user action.
    const currentUrl = new URL(window.location.href);
    const sourcePage = currentUrl.pathname === "/" ? "/" : currentUrl.pathname;

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType,
          name: trim("name"),
          businessEmail: trim("email"),
          company: trim("company"),
          role: trim("role"),
          country: trim("country"),
          phone: trim("phone"),
          message: trim("message"),
          sourcePage,
          utmSource: currentUrl.searchParams.get("utm_source") ?? undefined,
          utmMedium: currentUrl.searchParams.get("utm_medium") ?? undefined,
          utmCampaign: currentUrl.searchParams.get("utm_campaign") ?? undefined,
          referrer: document.referrer || undefined,
          website: trim("website"), // honeypot — always empty for a real visitor
        }),
      });

      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(data.error ?? dict.inquiryForm.genericError);
        return;
      }

      setStatus("success");
      const analytics = getAnalyticsProvider();
      analytics.trackEvent({ name: "inquiry_submitted", properties: { inquiryType } });
      const typeSpecificEvent = SUBMITTED_EVENT_BY_TYPE[inquiryType];
      if (typeSpecificEvent) {
        analytics.trackEvent({ name: typeSpecificEvent });
      }
    } catch {
      setStatus("error");
      setErrorMessage(dict.inquiryForm.networkError);
    }
  }

  return (
    <section
      id={sectionId}
      className={`${register === "dark" ? "register-dark " : ""}scroll-mt-20 bg-paper py-24 text-ink sm:py-32`}
    >
      <Shell>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div className="max-w-[34rem]">
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <Display size={2} className="mt-7">
              {copy.heading}
            </Display>
            <Lede className="mt-6">{copy.body}</Lede>
          </div>

          <div className="overflow-hidden rounded-xl border border-rule bg-paper-2" aria-live="polite">
          {status === "success" ? (
            <div className="flex flex-col gap-5 p-8 sm:p-10">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-sig-positive/40 text-sig-positive">
                <CheckCircle2 size={22} />
              </span>

              <h3 className="text-display-3 font-medium text-ink">{dict.inquiryForm.thanksHeading}</h3>

              <p className="max-w-md text-sm leading-6 text-ink-2">{copy.successBody}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
              {/* Only these two fields are actually required — see
                  createInquiryRequestSchema. Everything below is
                  visually separated and labeled optional so the form
                  reads as "two fields, plus a few optional details,"
                  not seven equal-weight demands. */}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id={`${formId}-name`} name="name" label={dict.inquiryForm.fields.fullName} required autoComplete="name" />
                <Field id={`${formId}-email`} name="email" label={dict.inquiryForm.fields.workEmail} type="email" required autoComplete="email" />
              </div>

              <div className="mt-7 border-t border-rule pt-6">
                <p className="font-mono text-label font-medium text-ink-3 uppercase">
                  {dict.inquiryForm.optionalHint}
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Field id={`${formId}-company`} name="company" label={dict.inquiryForm.fields.company} optional optionalLabel={dict.inquiryForm.fields.optional} autoComplete="organization" />
                  <Field id={`${formId}-country`} name="country" label={dict.inquiryForm.fields.country} optional optionalLabel={dict.inquiryForm.fields.optional} autoComplete="country-name" />

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={`${formId}-role`} className="text-sm font-medium text-ink">
                      {dict.inquiryForm.fields.role} <span className="font-normal text-ink-3">{dict.inquiryForm.fields.optional}</span>
                    </label>
                    <select
                      id={`${formId}-role`}
                      name="role"
                      defaultValue=""
                      className="h-11 rounded-md border border-rule-2 bg-paper px-3 text-sm text-ink outline-none transition-colors duration-control focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25"
                    >
                      <option value="">{dict.inquiryForm.fields.selectRole}</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Field id={`${formId}-phone`} name="phone" label={dict.inquiryForm.fields.phone} type="tel" optional optionalLabel={dict.inquiryForm.fields.optional} autoComplete="tel" />

                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label htmlFor={`${formId}-message`} className="text-sm font-medium text-ink">
                      {dict.inquiryForm.fields.message} <span className="font-normal text-ink-3">{dict.inquiryForm.fields.optional}</span>
                    </label>
                    <textarea
                      id={`${formId}-message`}
                      name="message"
                      rows={4}
                      placeholder={dict.inquiryForm.fields.messagePlaceholder}
                      className="resize-none rounded-md border border-rule-2 bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-control placeholder:text-ink-3 focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25"
                    />
                  </div>
                </div>
              </div>

              {/* Honeypot — hidden from real visitors via CSS, not `type="hidden"`
                  (some bots skip those). Never focusable, never announced. */}
              <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor={`${formId}-website`}>{dict.inquiryForm.fields.website}</label>
                <input id={`${formId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              {status === "error" && errorMessage && (
                <p role="alert" className="mt-6 text-sm text-sig-critical">
                  {errorMessage}
                </p>
              )}

              <div className="mt-7">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-solid px-5 text-sm font-medium text-solid-on transition-colors duration-control hover:bg-accent hover:text-accent-on focus-visible:ring-3 focus-visible:ring-accent/40 focus-visible:outline-none disabled:opacity-60"
                >
                  {status === "submitting" ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      {dict.inquiryForm.submitting}
                    </>
                  ) : (
                    <>
                      {copy.submitLabel}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          </div>
        </div>
      </Shell>
    </section>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required = false,
  optional = false,
  optionalLabel = "(optional)",
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  optionalLabel?: string;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label} {required && <span className="text-accent">*</span>}
        {optional && <span className="font-normal text-ink-3">{optionalLabel}</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="h-11 rounded-md border border-rule-2 bg-paper px-3 text-sm text-ink outline-none transition-colors duration-control placeholder:text-ink-3 focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25"
      />
    </div>
  );
}
