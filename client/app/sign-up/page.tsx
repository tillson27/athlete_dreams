import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Start a profile',
};

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-16">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
        <Badge tone="primary-soft">Pilot Cohort — Limited Spots</Badge>
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight">
          Tell your story.
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Create your athlete profile in 15 minutes. Add photos, accomplishments, and the events you want to fund. We&rsquo;ll help you launch your first campaign.
        </p>
        <form className="mt-8 space-y-5" action="/sign-up" method="post">
          <Field name="displayName" type="text" label="Full Name" placeholder="Maya Okafor" />
          <Field
            name="email"
            type="email"
            autoComplete="email"
            label="Email"
            placeholder="you@athleteclub.com"
          />
          <Field
            name="password"
            type="password"
            autoComplete="new-password"
            label="Password"
            placeholder="At least 8 characters"
            minLength={8}
          />
          <Button tone="primary" size="lg" className="w-full" type="submit">
            Create My Profile
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold text-primary hover:underline">
            Sign in
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
