'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { authInputClass } from '@/components/ui/formStyles';
import { passwordIsStrong } from '@/lib/passwordStrength';
import { ApiError, resetPassword } from '@/lib/api';

type SubmitState = 'idle' | 'submitting' | 'done';

export function ResetPasswordPanel() {
  const token = useSearchParams().get('token');

  if (!token) {
    return (
      <div className="mt-8 rounded-input bg-error/10 px-4 py-4 text-sm text-error">
        <p className="font-semibold">This reset link is missing a token.</p>
        <Link
          href="/forgot-password"
          className="mt-3 inline-flex min-h-11 items-center font-semibold underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!passwordIsStrong(password)) {
      setError('Use at least 10 characters with a letter and a number.');
      return;
    }

    setSubmitState('submitting');
    try {
      await resetPassword({ token, password });
      setSubmitState('done');
    } catch (cause) {
      setSubmitState('idle');
      setError(
        cause instanceof ApiError && cause.status === 400
          ? 'This reset link has expired. Request a new one.'
          : 'Could not reset your password. Try again in a minute.'
      );
    }
  };

  if (submitState === 'done') {
    return (
      <div className="mt-8 rounded-input bg-success/15 px-4 py-4 text-sm text-on-surface">
        <p className="font-semibold">Your password has been updated.</p>
        <Link
          href="/sign-in"
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary hover:underline"
        >
          Sign in with your new password
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <label className="block space-y-1.5">
        <span className="label-bold text-on-surface">New password</span>
        <span className="relative block">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={10}
            placeholder="At least 10 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${authInputClass} pr-16`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-pill px-2 text-xs font-semibold text-secondary hover:bg-surface-container hover:underline"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </span>
      </label>
      <PasswordStrengthMeter password={password} />
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
            Updating…
          </span>
        ) : (
          'Update password'
        )}
      </Button>
      {error ? (
        <p
          role="alert"
          className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error"
        >
          {error}{' '}
          {error.startsWith('This reset link') ? (
            <Link href="/forgot-password" className="inline-flex min-h-11 items-center underline">
              Request a new link
            </Link>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
