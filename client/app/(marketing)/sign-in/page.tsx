import type { Metadata } from 'next';
import Link from 'next/link';
import { SignInForm } from './SignInForm';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-10 sm:py-16">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6 sm:p-8">
        <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Sign in to manage your profile, share your story, and keep your journey up to date.
        </p>
        <SignInForm />
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-1 text-center text-sm text-on-surface-variant">
          <span>New here?</span>
          <Link
            href="/sign-up"
            className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline"
          >
            Create an athlete profile
          </Link>
          <span>.</span>
        </p>
      </div>
    </div>
  );
}
