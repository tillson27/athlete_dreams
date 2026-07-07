'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { signUp } from '@/lib/session';

export function SignUpForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('displayName') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    setSubmitting(true);
    signUp({ name, email });
    router.push('/register/personal-basics');
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
        type="password"
        autoComplete="new-password"
        label="Password"
        placeholder="At least 8 characters"
        minLength={8}
      />
      <Button tone="primary" size="lg" className="w-full" type="submit" disabled={submitting}>
        {submitting ? 'Creating your profile…' : 'Start my profile'}
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
}: {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="label-bold text-on-surface">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        placeholder={placeholder}
        className="w-full rounded-input border border-outline-variant bg-surface-container-low px-4 py-3 text-base text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:border-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/25"
      />
    </label>
  );
}
