import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Reset password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-16">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
        <h1 className="font-display text-3xl font-extrabold leading-tight">Reset your password</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Enter the email you used for ARC and we&rsquo;ll send a signed reset link.
        </p>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Remembered it?{' '}
          <Link href="/sign-in" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
