"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signUp, type AuthActionState } from "../auth/actions";

const INITIAL_STATE: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, INITIAL_STATE);

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/cloudonna-favicon-512.png" alt="ClouDonna" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="text-lg font-semibold tracking-tight text-slate-950">
            Clou<span className="text-violet-600">Donna</span>
          </span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-violet-700">
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>

      <div className="mt-12 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-8 shadow-[0_30px_90px_-45px_rgba(79,70,229,0.35)] backdrop-blur-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Create your account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          An account lets you save decisions, build a history, and revisit past recommendations inside an
          organization. Nothing about the anonymous Donna experience changes.
        </p>

        <form action={action} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-name" className="text-sm font-medium text-slate-800">
              Full name
            </label>
            <input
              id="signup-name"
              name="fullName"
              type="text"
              autoComplete="name"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-email" className="text-sm font-medium text-slate-800">
              Work email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="signup-password" className="text-sm font-medium text-slate-800">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/20"
            />
            <p className="text-xs text-slate-400">At least 8 characters.</p>
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}
          {state.info && (
            <p role="status" className="text-sm text-emerald-700">
              {state.info}
            </p>
          )}

          <Button type="submit" disabled={pending} className="h-11 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
            {pending && <LoaderCircle size={16} className="animate-spin" />}
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-violet-700 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
