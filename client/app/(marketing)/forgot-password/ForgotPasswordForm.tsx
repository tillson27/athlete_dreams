'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { authInputClass } from '@/components/ui/formStyles';
import { forgotPassword } from '@/lib/api';

type SubmitState = 'idle' | 'submitting' | 'sent';

export function ForgotPasswordForm() {
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    setError(null);
    setSubmitState('submitting');
    try {
      await forgotPassword({ email });
      setSubmitState('sent');
    } catch {
      setError('Could not request a reset email. Try again in a minute.');
      setSubmitState('idle');
    }
  };

  if (submitState === 'sent') {
    return (
      <div className="mt-8 rounded-input bg-primary-container/20 px-4 py-4 text-sm text-on-surface">
        <p className="font-semibold">If that email has an ARC account, reset instructions are on the way.</p>
        <Link href="/sign-in" className="mt-3 inline-flex font-semibold text-primary hover:underline">
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <label className="block space-y-1.5">
        <span className="label-bold text-on-surface">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@runmail.com"
          className={authInputClass}
        />
      </label>
      <Button
        tone="primary"
        size="lg"
        className="w-full"
        type="submit"
        disabled={submitState === 'submitting'}
      >
        {submitState === 'submitting' ? (
          <span className="inline-flex items-center gap-2">
            <Icon name="sync" className="h-4 w-4 animate-spin" />
            Sending…
          </span>
        ) : (
          'Send reset link'
        )}
      </Button>
      {error ? (
        <p
          role="alert"
          className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
