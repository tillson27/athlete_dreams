'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { authInputClass } from '@/components/ui/formStyles';
import { ApiError, resendVerification, verifyEmail } from '@/lib/api';
import { refreshSessionUser, useSession } from '@/lib/session';

type VerificationState = 'checking' | 'verified' | 'expired' | 'errored' | 'missing';
type ResendState = 'idle' | 'sending' | 'sent';

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { session, ready: sessionReady } = useSession();
  const [verificationState, setVerificationState] = useState<VerificationState>(
    token ? 'checking' : 'missing'
  );
  const [resendState, setResendState] = useState<ResendState>('idle');
  const [resendError, setResendError] = useState<string | null>(null);
  // Without this the signed-in-and-verified athlete lands on a resend form whose
  // request the API no-ops (it refuses to re-send to a verified address), so the
  // page would promise an email that never arrives.
  const alreadyVerified = sessionReady && Boolean(session) && !session?.mustVerifyEmail;
  // Guard against double-invocation (React Strict Mode mounts effects twice in dev;
  // a second call would find the token already consumed and show a false "expired" error).
  const verifyCalledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setVerificationState('missing');
      return;
    }
    if (verifyCalledRef.current) return;
    verifyCalledRef.current = true;

    setVerificationState('checking');
    let cancelled = false;
    verifyEmail({ token })
      .then(async () => {
        // Best-effort only. The server has already verified the address by this
        // point, so a stale access token (the emailed link outlives the session)
        // must never downgrade a real success into an "expired link" message.
        await refreshSessionUser().catch(() => undefined);
        if (!cancelled) setVerificationState('verified');
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        const rejectedToken = cause instanceof ApiError && cause.status === 400;
        setVerificationState(rejectedToken ? 'expired' : 'errored');
      });
    return () => { cancelled = true; };
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
      {verificationState !== 'checking' && verificationState !== 'verified' && alreadyVerified ? (
        <StatusMessage
          icon="check-circle"
          title="Your email is already verified."
          body="Nothing left to do here."
          tone="neutral"
        />
      ) : null}
      {verificationState === 'expired' && !alreadyVerified ? (
        <StatusMessage
          icon="info"
          title="This verification link has expired."
          body="Links last 48 hours. Send yourself a new one below."
          tone="error"
        />
      ) : null}
      {verificationState === 'errored' && !alreadyVerified ? (
        <StatusMessage
          icon="info"
          title="We couldn't reach the server to check your link."
          body="Your link is still good. Reload this page to try again."
          tone="error"
        />
      ) : null}
      {verificationState === 'missing' && !alreadyVerified ? (
        <StatusMessage
          icon="shield"
          title="Request a fresh verification email."
          body="Use the email on your ARC account."
          tone="neutral"
        />
      ) : null}
      {verificationState !== 'verified' && !alreadyVerified ? (
        <form className="space-y-4" onSubmit={handleResend}>
          <label className="block space-y-1.5">
            <span className="label-bold text-on-surface">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@runmail.com"
              defaultValue={session?.email ?? ''}
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
  icon: 'check-circle' | 'info' | 'shield' | 'sync';
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
