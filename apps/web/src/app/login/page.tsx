"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithMagicLink, signInWithPassword, type AuthActionState } from "../auth/actions";

const INITIAL_STATE: AuthActionState = { error: null };

export default function LoginPage() {
  const [usePassword, setUsePassword] = useState(false);
  const [magicLinkState, magicLinkAction, magicLinkPending] = useActionState(signInWithMagicLink, INITIAL_STATE);
  const [passwordState, passwordAction, passwordPending] = useActionState(signInWithPassword, INITIAL_STATE);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-void px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/cloudonna-favicon-512.png" alt="ClouDonna" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="text-lg font-semibold tracking-tight text-nova-ink">
            Clou<span className="text-nova-accent-strong">Donna</span>
          </span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-nova-ink-muted transition hover:text-nova-accent-strong">
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>

      <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-titanium bg-carbon/80 p-8 shadow-[0_30px_90px_-45px_rgba(79,70,229,0.35)] backdrop-blur-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-nova-ink">Sign in to ClouDonna</h1>
        <p className="mt-2 text-sm leading-6 text-nova-ink-faint">
          Sign in to save decisions, build a history, and revisit past recommendations. Trying Donna itself never
          requires an account.
        </p>

        {!usePassword ? (
          magicLinkSent ? (
            <div role="status" aria-live="polite" className="mt-8 rounded-2xl border border-nova-success/30 bg-nova-success/10 p-5 text-sm text-nova-success">
              Check your email for a sign-in link. It expires shortly, so use it soon.
            </div>
          ) : (
            <form action={magicLinkAction} className="mt-8 flex flex-col gap-4" onSubmit={() => setMagicLinkSent(true)}>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-sm font-medium text-nova-ink">
                  Work email
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="h-11 rounded-xl border border-titanium bg-carbon px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
                />
              </div>

              {magicLinkState.error && (
                <p role="alert" className="text-sm text-red-400">
                  {magicLinkState.error}
                </p>
              )}

              <Button type="submit" disabled={magicLinkPending} className="h-11 bg-nova-accent text-white">
                {magicLinkPending ? <LoaderCircle size={16} className="animate-spin" /> : <Mail size={16} />}
                Send magic link
              </Button>

              <button
                type="button"
                onClick={() => setUsePassword(true)}
                className="text-center text-sm font-medium text-nova-ink-faint underline-offset-4 hover:text-nova-accent-strong hover:underline"
              >
                Use a password instead
              </button>
            </form>
          )
        ) : (
          <form action={passwordAction} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email-pw" className="text-sm font-medium text-nova-ink">
                Work email
              </label>
              <input
                id="login-email-pw"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-11 rounded-xl border border-titanium bg-carbon px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-medium text-nova-ink">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-11 rounded-xl border border-titanium bg-carbon px-3 text-sm text-nova-ink outline-none focus-visible:border-nova-accent focus-visible:ring-3 focus-visible:ring-nova-accent/30"
              />
            </div>

            {passwordState.error && (
              <p role="alert" className="text-sm text-red-400">
                {passwordState.error}
              </p>
            )}

            <Button type="submit" disabled={passwordPending} className="h-11 bg-nova-accent text-white">
              {passwordPending && <LoaderCircle size={16} className="animate-spin" />}
              Sign in
            </Button>

            <button
              type="button"
              onClick={() => setUsePassword(false)}
              className="text-center text-sm font-medium text-nova-ink-faint underline-offset-4 hover:text-nova-accent-strong hover:underline"
            >
              Use a magic link instead
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-nova-ink-faint">
          New to ClouDonna?{" "}
          <Link href="/signup" className="font-medium text-nova-accent-strong underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
