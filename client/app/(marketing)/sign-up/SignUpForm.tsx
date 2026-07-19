'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { signUp } from '@/lib/session';
import { toAuthErrorView, type AuthErrorView } from '@/lib/authErrors';
import { authInputClass } from '@/components/ui/formStyles';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { passwordIsStrong } from '@/lib/passwordStrength';

export function SignUpForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AuthErrorView | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('displayName') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const submittedPassword = String(form.get('password') ?? '');
    setError(null);

    if (!passwordIsStrong(submittedPassword)) {
      setError({ message: 'Use at least 10 characters with a letter and a number.' });
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ name, email, password: submittedPassword });
      router.push('/register/personal-basics');
    } catch (cause) {
      setError(toAuthErrorView('sign-up', cause));
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <Field name="displayName" type="text" label="Full name" placeholder="Maya Okafor" />
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
        autoComplete="new-password"
        label="Password"
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-2 text-xs font-semibold text-secondary hover:bg-surface-container hover:underline"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        }
        placeholder="At least 10 characters"
        minLength={10}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <PasswordStrengthMeter password={password} />
      <Button tone="primary" size="lg" className="w-full" type="submit" disabled={submitting}>
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Icon name="sync" className="h-4 w-4 animate-spin" />
            Creating your profile…
          </span>
        ) : (
          'Start my profile'
        )}
      </Button>
      {error ? (
        <p
          role="alert"
          className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error"
        >
          {error.message}
          {error.linkToSignIn ? (
            <>
              {' '}
              <Link href="/sign-in" className="underline">
                sign in instead
              </Link>
              .
            </>
          ) : null}
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
  value,
  onChange,
}: {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
  trailing?: React.ReactNode;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="label-bold text-on-surface">{label}</span>
      <span className="relative block">
        <input
          name={name}
          type={type}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${authInputClass} ${trailing ? 'pr-16' : ''}`}
        />
        {trailing ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </span>
    </label>
  );
}
