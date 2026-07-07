'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Icon } from '../_components/Icon';
import { ProfilePreview } from '../_components/ProfilePreview';
import { useOnboarding } from '../_components/OnboardingContext';
import { findMockAthlete } from '@/lib/mockAthletes';
import { markPublished } from '@/lib/session';

type Status = 'idle' | 'publishing' | 'published';

const confettiColors = [
  'var(--color-primary)',
  'var(--color-primary-container)',
  'var(--color-secondary)',
  'var(--color-success)',
];

function useConfetti() {
  return useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        id: index,
        left: `${Math.round((index / 16) * 100 + Math.random() * 6)}%`,
        delay: `${(Math.random() * 0.6).toFixed(2)}s`,
        color: confettiColors[index % confettiColors.length],
      })),
    [],
  );
}

export function PublishPanel() {
  const { profile } = useOnboarding();
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const confetti = useConfetti();

  const firstName = profile.name.trim().split(' ')[0] || 'Athlete';
  const slug =
    profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'your-name';
  const profileExists = Boolean(findMockAthlete(slug));
  const profileHref = profileExists ? `/athletes/${slug}` : '/athletes';
  const manageHref = profileExists
    ? `/athletes/${slug}/manage`
    : '/athletes/cassandra-de-winter/manage';
  const publicUrl = `arc.network/athletes/${slug}`;

  const publish = () => {
    if (!agreed) {
      setError(true);
      return;
    }
    setStatus('publishing');
    setTimeout(() => {
      markPublished();
      setStatus('published');
    }, 1500);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — link is still visible to copy manually */
    }
  };

  if (status === 'published') {
    return createPortal(
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-surface">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className="confetti-piece"
              style={{ left: piece.left, animationDelay: piece.delay, backgroundColor: piece.color }}
            />
          ))}
        </div>

        <div className="relative mx-auto flex min-h-full max-w-lg flex-col items-center justify-center px-5 py-16 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-pill bg-success/15 px-4 py-2 text-success">
            <Icon name="check-circle" className="h-5 w-5" />
            <span className="label-bold">Profile published</span>
          </span>

          <h1 className="mb-3 font-display text-4xl font-extrabold text-on-surface sm:text-5xl">
            You&rsquo;re live, {firstName}!
          </h1>
          <p className="mb-8 max-w-md text-lg text-on-surface-variant">
            Your story is on ARC. Share your link and start bringing people along for the journey.
          </p>

          <div className="w-full">
            <ProfilePreview sticky={false} showMeta={false} />
          </div>

          <div className="mt-8 flex w-full items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-2 pl-4">
            <Icon name="link" className="h-5 w-5 shrink-0 text-on-surface-variant" />
            <span className="flex-1 truncate text-left text-sm text-on-surface-variant">
              {publicUrl}
            </span>
            <button
              type="button"
              onClick={copyLink}
              className="label-bold shrink-0 rounded-md bg-surface-container px-4 py-2 text-on-surface transition-all hover:bg-surface-container-high active:scale-95"
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>

          <div className="mt-8 w-full rounded-xl border border-outline-variant bg-surface-container-low p-5 text-left">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-container/20 text-primary">
                <Icon name="trophy" className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <h2 className="label-bold text-on-surface">Make it stronger</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Your profile is live — now add your <strong>career highlights</strong> and{' '}
                  <strong>previous races</strong> so supporters can follow your whole journey.
                </p>
                <Link
                  href={manageHref}
                  className="label-bold mt-3 inline-flex items-center gap-1.5 text-secondary hover:underline"
                >
                  Add highlights &amp; races
                  <Icon name="arrow-forward" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="label-bold flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-on-primary transition-all hover:bg-[#832700] active:scale-95"
            >
              Go to your dashboard
              <Icon name="arrow-forward" className="h-5 w-5" />
            </Link>
            <Link
              href={profileHref}
              className="label-bold flex flex-1 items-center justify-center rounded-lg border-2 border-outline px-6 py-4 text-on-surface transition-all hover:bg-surface-container"
            >
              View your profile
            </Link>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-4 ${error ? 'animate-pulse' : ''}`}>
        <input
          id="terms"
          type="checkbox"
          checked={agreed}
          onChange={(event) => {
            setAgreed(event.target.checked);
            if (event.target.checked) setError(false);
          }}
          className="h-5 w-5 cursor-pointer rounded border-outline text-primary focus:ring-primary"
        />
        <label htmlFor="terms" className="label-bold cursor-pointer select-none text-on-surface">
          I agree to the Radical Transparency guidelines
        </label>
      </div>
      <button
        type="button"
        onClick={publish}
        disabled={status === 'publishing'}
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary py-4 font-display text-2xl font-bold text-on-primary transition-all hover:bg-[#832700] active:scale-95 disabled:opacity-80"
      >
        {status === 'publishing' ? (
          <>
            <Icon name="sync" className="h-6 w-6 animate-spin" />
            Publishing...
          </>
        ) : (
          <>
            Publish my profile
            <Icon name="rocket" className="h-6 w-6" />
          </>
        )}
      </button>
      <p className="text-center text-xs text-on-surface-variant">
        Your profile will be live immediately upon publishing.
      </p>
    </div>
  );
}
