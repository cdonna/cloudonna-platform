"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/LocaleProvider";
import { signUp, type AuthActionState } from "../../../auth/actions";

const INITIAL_STATE: AuthActionState = { error: null };

export function SignupForm({ locale }: { locale: string }) {
  const { dict } = useLocale();
  const [state, action, pending] = useActionState(signUp, INITIAL_STATE);

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-paper px-6 py-16">
      <div className="overflow-hidden rounded-[1.75rem] border border-rule bg-paper-2/80 p-8 shadow-[0_30px_90px_-45px_rgba(79,70,229,0.35)] backdrop-blur-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{dict.signup.h1}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-3">{dict.signup.sub}</p>

        <form action={action} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-name" className="text-sm font-medium text-ink">
              {dict.signup.fullName}
            </label>
            <input
              id="signup-name"
              name="fullName"
              type="text"
              autoComplete="name"
              className="h-11 rounded-xl border border-rule bg-paper-2 px-3 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-email" className="text-sm font-medium text-ink">
              {dict.signup.workEmail}
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-11 rounded-xl border border-rule bg-paper-2 px-3 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-password" className="text-sm font-medium text-ink">
              {dict.signup.password}
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-11 rounded-xl border border-rule bg-paper-2 px-3 text-sm text-ink outline-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/25"
            />
            <p className="text-xs text-ink-3">{dict.signup.passwordHint}</p>
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-red-400">
              {state.error}
            </p>
          )}
          {state.info && (
            <p role="status" className="text-sm text-nova-success">
              {state.info}
            </p>
          )}

          <Button type="submit" disabled={pending} className="h-11 bg-solid text-solid-on">
            {pending && <LoaderCircle size={16} className="animate-spin" />}
            {dict.signup.createAccount}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-3">
          {dict.signup.alreadyHaveAccount}{" "}
          <Link href={`/${locale}/login`} className="font-medium text-accent underline-offset-4 hover:underline">
            {dict.signup.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
