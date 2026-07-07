import type { Metadata } from 'next';
import Link from 'next/link';
import { SignInForm } from './SignInForm';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-16">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
        <h1 className="font-display text-3xl font-extrabold leading-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Sign in to manage your profile, share your story, and keep your journey up to date.
        </p>
        <SignInForm />
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
