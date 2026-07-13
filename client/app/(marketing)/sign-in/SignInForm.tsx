'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { signIn } from '@/lib/prototype/session';
import { authInputClass } from '@/components/ui/formStyles';

export function SignInForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    setSubmitting(true);
    signIn({ email });
    setTimeout(() => router.push('/dashboard'), 600);
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
        minLength={8}
      />
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
