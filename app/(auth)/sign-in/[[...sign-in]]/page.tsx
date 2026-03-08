"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { credentialsSignIn } from "@/lib/auth-actions";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M1 12C1 12 5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/";

  const [error, action, pending] = useActionState(credentialsSignIn, null);
  const [showPw, setShowPw]      = useState(false);

  return (
    <div className="animate-slide-up">
      <h1 className="text-title mb-1">Sign in</h1>
      <p className="text-body text-text-secondary mb-8">Welcome back.</p>

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <input
          className="input-field"
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          required
        />

        <div className="relative">
          <input
            className="input-field pr-12"
            type={showPw ? "text" : "password"}
            name="password"
            placeholder="Password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            <EyeIcon open={showPw} />
          </button>
        </div>

        {error && <p className="text-label text-red-400">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-label text-text-secondary text-center mt-6">
        No account?{" "}
        <Link href="/sign-up" className="text-action">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
