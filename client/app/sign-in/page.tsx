import type { Metadata } from 'next';
import Link from 'next/link';
import { LinkButton } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-[var(--radius-card)] bg-white p-8 ring-1 ring-inset ring-ink/5">
        <h1 className="font-display text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-ink/70">
          Sign in to manage your profile, post campaign updates, or back an athlete.
        </p>
        <form className="mt-8 space-y-4" action="/sign-in" method="post">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-base outline-none transition-colors focus:border-ink focus:bg-white"
              placeholder="you@athleteclub.com"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-base outline-none transition-colors focus:border-ink focus:bg-white"
              placeholder="••••••••"
            />
          </label>
          <LinkButton href="/sign-in" tone="primary" size="lg" className="w-full justify-center">
            Sign in
          </LinkButton>
        </form>
        <p className="mt-6 text-center text-sm text-ink/65">
          New here?{' '}
          <Link href="/sign-up" className="font-semibold text-flame hover:underline">
            Create an athlete profile
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
