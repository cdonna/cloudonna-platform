"use client";

import { useId, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

const roles = [
  "IT / Enterprise Architecture",
  "Procurement",
  "Executive Leadership",
  "Consulting / Implementation Partner",
  "Other",
];

const interests = [
  "Donna AI",
  "Donna Compare",
  "Donna Marketplace",
  "Donna Intelligence",
  "Donna Workspace",
];

export default function EarlyAccess() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );
  const formId = useId();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === "submitting") {
      return;
    }

    setStatus("submitting");

    window.setTimeout(() => {
      setStatus("success");
    }, 700);
  }

  return (
    <section
      id="early-access"
      className="relative scroll-mt-8 overflow-hidden bg-gradient-to-b from-white via-indigo-50/40 to-white px-6 py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-violet-200/30 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-3xl">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 shadow-sm">
            <Mail size={14} />
            Public Alpha
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-5xl">
            Request early access
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            ClouDonna is opening access in waves. This is a preview of the
            request flow — in this alpha build, submissions are not
            transmitted or stored anywhere.
          </p>
        </div>

        <div
          className="mt-12 overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_35px_100px_-35px_rgba(79,70,229,0.35)] backdrop-blur-xl"
          aria-live="polite"
        >
          {status === "success" ? (
            <div className="flex flex-col items-center gap-4 p-10 text-center sm:p-14">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={28} />
              </span>

              <h3 className="text-2xl font-semibold text-slate-950">
                Preview complete
              </h3>

              <p className="max-w-md text-sm leading-6 text-slate-600">
                Thanks for trying the Early Access flow. In this alpha
                build, submissions are not transmitted or stored anywhere —
                a live intake process will be enabled in a future release.
              </p>

              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-2 text-sm font-medium text-violet-700 hover:text-violet-800"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="grid gap-5 p-7 sm:grid-cols-2 sm:p-10"
              noValidate={false}
            >
              <Field
                id={`${formId}-name`}
                label="Full name"
                required
                autoComplete="name"
              />

              <Field
                id={`${formId}-email`}
                label="Work email"
                type="email"
                required
                autoComplete="email"
              />

              <Field
                id={`${formId}-company`}
                label="Company"
                required
                autoComplete="organization"
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`${formId}-role`}
                  className="text-sm font-medium text-slate-800"
                >
                  Role <span className="text-violet-600">*</span>
                </label>
                <select
                  id={`${formId}-role`}
                  name="role"
                  required
                  defaultValue=""
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
                >
                  <option value="" disabled>
                    Select your role
                  </option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor={`${formId}-interest`}
                  className="text-sm font-medium text-slate-800"
                >
                  Primary interest <span className="text-violet-600">*</span>
                </label>
                <select
                  id={`${formId}-interest`}
                  name="interest"
                  required
                  defaultValue=""
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
                >
                  <option value="" disabled>
                    Select a ClouDonna product
                  </option>
                  {interests.map((interest) => (
                    <option key={interest} value={interest}>
                      {interest}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label
                  htmlFor={`${formId}-message`}
                  className="text-sm font-medium text-slate-800"
                >
                  Message{" "}
                  <span className="font-normal text-slate-400">
                    (optional)
                  </span>
                </label>
                <textarea
                  id={`${formId}-message`}
                  name="message"
                  rows={4}
                  placeholder="Tell us about your landscape or what you'd like Donna to help with..."
                  className="resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={status === "submitting"}
                  className="h-12 w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-violet-200"
                >
                  {status === "submitting" ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      Submitting
                    </>
                  ) : (
                    <>
                      Request early access
                      <ArrowRight size={16} />
                    </>
                  )}
                </Button>

                <p className="mt-3 text-center text-xs text-slate-400">
                  Preview only — no account or payment required, and
                  submissions are not transmitted or stored in this alpha
                  build.
                </p>
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
  label,
  type = "text",
  required = false,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label} {required && <span className="text-violet-600">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
      />
    </div>
  );
}
