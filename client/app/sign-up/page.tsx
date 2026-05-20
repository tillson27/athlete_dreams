import type { Metadata } from 'next';
import Link from 'next/link';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Start a profile',
};

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-[var(--radius-card)] bg-white p-8 ring-1 ring-inset ring-ink/5">
        <Badge tone="flame">Pilot cohort — limited spots</Badge>
        <h1 className="mt-4 font-display text-3xl">Tell your story.</h1>
        <p className="mt-2 text-sm text-ink/70">
          Create your athlete profile in 15 minutes. Add photos, accomplishments, and the events you want to fund. We'll help you launch your first campaign.
        </p>
        <form className="mt-8 space-y-4" action="/sign-up" method="post">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink/60">Full name</span>
            <input
              name="displayName"
              required
              maxLength={80}
              className="w-full rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-base outline-none transition-colors focus:border-ink focus:bg-white"
              placeholder="Maya Okafor"
            />
          </label>
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
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-base outline-none transition-colors focus:border-ink focus:bg-white"
              placeholder="At least 8 characters"
            />
          </label>
          <LinkButton href="/sign-up" tone="flame" size="lg" className="w-full justify-center">
            Create my profile
          </LinkButton>
        </form>
        <p className="mt-6 text-center text-sm text-ink/65">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold text-flame hover:underline">
            Sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
