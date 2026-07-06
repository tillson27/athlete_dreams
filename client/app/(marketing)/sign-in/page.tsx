import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-16">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
        <h1 className="font-display text-3xl font-extrabold leading-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Sign in to manage your profile, post campaign updates, or back an athlete.
        </p>
        <form className="mt-8 space-y-5" action="/sign-in" method="post">
          <Field name="email" type="email" autoComplete="email" label="Email" placeholder="you@athleteclub.com" />
          <Field
            name="password"
            type="password"
            autoComplete="current-password"
            label="Password"
            placeholder="••••••••"
            minLength={8}
          />
          <Button tone="primary" size="lg" className="w-full" type="submit">
            Sign In
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          New here?{' '}
          <Link href="/sign-up" className="font-semibold text-primary hover:underline">
            Create an athlete profile
          </Link>
          .
        </p>
      </div>
    </div>
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
