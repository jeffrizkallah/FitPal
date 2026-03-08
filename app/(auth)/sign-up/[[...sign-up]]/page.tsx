"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAndSignIn } from "@/lib/auth-actions";

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

export default function SignUpPage() {
  const [serverError, action, pending] = useActionState(registerAndSignIn, null);
  const [matchError,  setMatchError]   = useState<string | null>(null);
  const [showPw,      setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm]  = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd       = new FormData(e.currentTarget);
    const pw       = fd.get("password") as string;
    const confirm  = fd.get("confirmPassword") as string;

    if (pw !== confirm) {
      e.preventDefault();
      setMatchError("Passwords do not match.");
    } else {
      setMatchError(null);
    }
  }

  const error = matchError ?? serverError;

  return (
    <div className="animate-slide-up">
      <h1 className="text-title mb-1">Create account</h1>
      <p className="text-body text-text-secondary mb-8">Start tracking in under 2 minutes.</p>

      <form action={action} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="input-field"
          type="text"
          name="name"
          placeholder="First name"
          autoComplete="given-name"
          required
        />

        <input
          className="input-field"
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          required
        />

        {/* Password */}
        <div className="relative">
          <input
            className="input-field pr-12"
            type={showPw ? "text" : "password"}
            name="password"
            placeholder="Password (min 8 characters)"
            autoComplete="new-password"
            minLength={8}
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

        {/* Confirm password */}
        <div className="relative">
          <input
            className="input-field pr-12"
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            <EyeIcon open={showConfirm} />
          </button>
        </div>

        {error && <p className="text-label text-red-400">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-label text-text-secondary text-center mt-6">
        Have an account?{" "}
        <Link href="/sign-in" className="text-action">
          Sign in
        </Link>
      </p>
    </div>
  );
}
