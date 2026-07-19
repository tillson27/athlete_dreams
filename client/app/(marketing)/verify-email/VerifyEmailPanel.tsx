'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { authInputClass } from '@/components/ui/formStyles';
import { resendVerification, verifyEmail } from '@/lib/api';

type VerificationState = 'checking' | 'verified' | 'failed' | 'missing';
type ResendState = 'idle' | 'sending' | 'sent';

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [verificationState, setVerificationState] = useState<VerificationState>(
    token ? 'checking' : 'missing'
  );
  const [resendState, setResendState] = useState<ResendState>('idle');
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setVerificationState('missing');
      return;
    }
    let active = true;
    setVerificationState('checking');
    verifyEmail({ token })
      .then(() => {
        if (active) setVerificationState('verified');
      })
      .catch(() => {
        if (active) setVerificationState('failed');
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    setResendError(null);
    setResendState('sending');
    try {
      await resendVerification({ email });
      setResendState('sent');
    } catch {
      setResendState('idle');
      setResendError('Could not send a verification email. Try again in a minute.');
    }
  };

  return (
    <div className="mt-8 space-y-5">
      {verificationState === 'checking' ? (
        <StatusMessage icon="sync" title="Checking your verification link" tone="neutral" spinning />
      ) : null}
      {verificationState === 'verified' ? (
        <div className="rounded-input bg-success/15 px-4 py-4 text-sm text-on-surface">
          <div className="flex items-start gap-3">
            <Icon name="check-circle" className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="font-semibold">Email verified.</p>
              <Link
                href="/dashboard"
                className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary hover:underline"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      {verificationState === 'failed' ? (
        <StatusMessage
          icon="info"
          title="This verification link has expired."
          body="Request a new link and use the most recent email."
          tone="error"
        />
      ) : null}
      {verificationState === 'missing' ? (
        <StatusMessage
          icon="shield"
          title="Request a fresh verification email."
          body="Use the email on your ARC account."
          tone="neutral"
        />
      ) : null}
      {verificationState !== 'verified' ? (
        <form className="space-y-4" onSubmit={handleResend}>
          <label className="block space-y-1.5">
            <span className="label-bold text-on-surface">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@runmail.com"
              className={authInputClass}
            />
          </label>
          <Button
            tone="primary"
            size="lg"
            className="w-full"
            type="submit"
            disabled={resendState === 'sending'}
          >
            {resendState === 'sent'
              ? 'Verification sent'
              : resendState === 'sending'
                ? 'Sending…'
                : 'Send verification email'}
          </Button>
          {resendError ? (
            <p
              role="alert"
              className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error"
            >
              {resendError}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

function StatusMessage({
  icon,
  title,
  body,
  tone,
  spinning = false,
}: {
  icon: 'info' | 'shield' | 'sync';
  title: string;
  body?: string;
  tone: 'neutral' | 'error';
  spinning?: boolean;
}) {
  return (
    <div
      className={`rounded-input px-4 py-4 text-sm ${
        tone === 'error'
          ? 'bg-error/10 text-error'
          : 'bg-primary-container/20 text-on-surface'
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon
          name={icon}
          className={`mt-0.5 h-5 w-5 shrink-0 ${spinning ? 'animate-spin' : ''}`}
        />
        <div>
          <p className="font-semibold">{title}</p>
          {body ? <p className="mt-1 text-on-surface-variant">{body}</p> : null}
        </div>
      </div>
    </div>
  );
}
