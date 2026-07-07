import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { SignUpForm } from './SignUpForm';

export const metadata: Metadata = {
  title: 'Start a profile',
};

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-16">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
        <Badge tone="primary-soft">Pilot Cohort — Limited Spots</Badge>
        <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight">Tell your story.</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Build a verified athlete profile in about 15 minutes — your story, your results, and the
          values you run by. Bring people along for the journey.
        </p>
        <SignUpForm />
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
