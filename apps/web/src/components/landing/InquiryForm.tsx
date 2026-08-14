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
import { ArrowRight, CheckCircle2, LoaderCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/LocaleProvider";
import { getAnalyticsProvider } from "@/lib/analytics/config";
import type { InquiryType } from "@/lib/inquiries/schema";

const SUBMITTED_EVENT_BY_TYPE: Partial<Record<InquiryType, string>> = {
  founding_tester: "founding_tester_submitted",
  partner: "partner_inquiry_submitted",
  vendor: "vendor_inquiry_submitted",
};

export function InquiryForm({ inquiryType, sectionId }: { inquiryType: InquiryType; sectionId?: string }) {
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
    <section id={sectionId} className="relative scroll-mt-8 overflow-hidden bg-void px-6 py-28">
      <div className="pointer-events-none absolute inset-0 motion-safe:animate-aurora-drift">
        <div className="absolute left-1/2 top-0 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-aurora-primary/20 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-titanium bg-carbon px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-nova-accent-strong">
            <Sparkles size={14} />
            {copy.eyebrow}
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-nova-ink sm:text-5xl">{copy.heading}</h2>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-nova-ink-muted">{copy.body}</p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-titanium bg-carbon shadow-nova-glow" aria-live="polite">
          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 p-10 text-center sm:p-14">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-nova-success/30 bg-nova-success/10 text-nova-success">
                <CheckCircle2 size={28} />
              </span>

              <h3 className="text-2xl font-semibold text-nova-ink">{dict.inquiryForm.thanksHeading}</h3>

              <p className="max-w-md text-sm leading-6 text-nova-ink-muted">{copy.successBody}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-7 sm:p-10">
              {/* Only these two fields are actually required — see
                  createInquiryRequestSchema. Everything below is
                  visually separated and labeled optional so the form
                  reads as "two fields, plus a few optional details,"
                  not seven equal-weight demands. */}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id={`${formId}-name`} name="name" label={dict.inquiryForm.fields.fullName} required autoComplete="name" />
                <Field id={`${formId}-email`} name="email" label={dict.inquiryForm.fields.workEmail} type="email" required autoComplete="email" />
              </div>

              <div className="mt-7 border-t border-titanium pt-6">
                <p className="text-xs font-medium tracking-[0.08em] text-nova-ink-faint uppercase">
                  {dict.inquiryForm.optionalHint}
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <Field id={`${formId}-company`} name="company" label={dict.inquiryForm.fields.company} optional optionalLabel={dict.inquiryForm.fields.optional} autoComplete="organization" />
                  <Field id={`${formId}-country`} name="country" label={dict.inquiryForm.fields.country} optional optionalLabel={dict.inquiryForm.fields.optional} autoComplete="country-name" />

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={`${formId}-role`} className="text-sm font-medium text-nova-ink">
                      {dict.inquiryForm.fields.role} <span className="font-normal text-nova-ink-faint">{dict.inquiryForm.fields.optional}</span>
                    </label>
                    <select
                      id={`${formId}-role`}
                      name="role"
                      defaultValue=""
                      className="h-11 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
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
                    <label htmlFor={`${formId}-message`} className="text-sm font-medium text-nova-ink">
                      {dict.inquiryForm.fields.message} <span className="font-normal text-nova-ink-faint">{dict.inquiryForm.fields.optional}</span>
                    </label>
                    <textarea
                      id={`${formId}-message`}
                      name="message"
                      rows={4}
                      placeholder={dict.inquiryForm.fields.messagePlaceholder}
                      className="resize-none rounded-xl border border-titanium bg-carbon-2 px-3 py-2.5 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
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
                <p role="alert" className="mt-6 text-sm text-red-400">
                  {errorMessage}
                </p>
              )}

              <div className="mt-7">
                <Button type="submit" disabled={status === "submitting"} className="h-12 w-full bg-nova-accent text-white shadow-nova-glow hover:bg-nova-accent-strong">
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
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
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
      <label htmlFor={id} className="text-sm font-medium text-nova-ink">
        {label} {required && <span className="text-nova-accent-strong">*</span>}
        {optional && <span className="font-normal text-nova-ink-faint">{optionalLabel}</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="h-11 rounded-xl border border-titanium bg-carbon-2 px-3 text-sm text-nova-ink outline-none placeholder:text-nova-ink-faint focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
      />
    </div>
  );
}
