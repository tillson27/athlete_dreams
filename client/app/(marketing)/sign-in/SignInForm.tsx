'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { signIn } from '@/lib/session';
import { resendVerification } from '@/lib/api';
import { toAuthErrorView, type AuthErrorView } from '@/lib/authErrors';
import { authInputClass } from '@/components/ui/formStyles';

type ResendStatus = 'idle' | 'sending' | 'sent';

export function SignInForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<AuthErrorView | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<ResendStatus>('idle');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    setError(null);
    setVerificationEmail(null);
    setResendStatus('idle');
    setSubmitting(true);

    try {
      const result = await signIn({ email, password });
      if (result.mustVerifyEmail) {
        setVerificationEmail(email);
        setSubmitting(false);
        return;
      }
      router.push('/dashboard');
    } catch (cause) {
      setError(toAuthErrorView('sign-in', cause));
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!verificationEmail) {
      return;
    }
    setResendStatus('sending');
    try {
      await resendVerification({ email: verificationEmail });
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
      setError({ message: 'Could not resend the verification email. Try again in a minute.' });
    }
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <Field
        name="email"
        type="email"
        autoComplete="email"
        label="Email"
        placeholder="you@runmail.com"
      />
      <Field
        name="password"
        type={showPassword ? 'text' : 'password'}
        autoComplete="current-password"
        label="Password"
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="text-xs font-semibold text-secondary hover:underline"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        }
        placeholder="••••••••"
      />
      <div className="-mt-2 text-right">
        <Link href="/forgot-password" className="text-sm font-semibold text-secondary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button tone="primary" size="lg" className="w-full" type="submit" disabled={submitting}>
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Icon name="sync" className="h-4 w-4 animate-spin" />
            Signing in…
          </span>
        ) : (
          'Sign in'
        )}
      </Button>
      {verificationEmail ? (
        <div
          role="status"
          className="space-y-3 rounded-input bg-primary-container/20 px-4 py-3 text-sm text-on-surface"
        >
          <p className="font-semibold">
            Please verify your email first. You are signed in, but publishing stays locked until
            verification is complete.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendStatus === 'sending'}
              className="label-bold rounded-pill border border-primary px-4 py-2 text-primary transition-colors hover:bg-primary hover:text-on-primary disabled:opacity-60"
            >
              {resendStatus === 'sent'
                ? 'Verification sent'
                : resendStatus === 'sending'
                  ? 'Sending…'
                  : 'Resend verification'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="label-bold rounded-pill bg-primary px-4 py-2 text-on-primary transition-colors hover:bg-primary-strong"
            >
              Continue to dashboard
            </button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error"
        >
          {error.message}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  name,
  type,
  label,
  placeholder,
  autoComplete,
  minLength,
  trailing,
}: {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between">
        <span className="label-bold text-on-surface">{label}</span>
        {trailing}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        placeholder={placeholder}
        className={authInputClass}
      />
    </label>
  );
}
