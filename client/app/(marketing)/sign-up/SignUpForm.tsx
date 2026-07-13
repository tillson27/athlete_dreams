'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { signUp } from '@/lib/session';
import { isApiError } from '@/lib/api/client';
import { authInputClass } from '@/components/ui/formStyles';

export function SignUpForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const displayName = String(form.get('displayName') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    setSubmitting(true);
    setError(null);
    try {
      await signUp({ displayName, email, password });
      router.push('/register/personal-basics');
    } catch (submitError) {
      setError(
        isApiError(submitError)
          ? submitError.message
          : 'We could not create your account. Try again.',
      );
    } finally {
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
            className="text-xs font-semibold text-secondary hover:underline"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        }
        placeholder="At least 8 characters"
        minLength={8}
      />
      {error ? (
        <p className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error">
          {error}
        </p>
      ) : null}
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
