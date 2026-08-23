'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { ProfilePreview } from '../_components/ProfilePreview';
import { useOnboarding } from '../_components/OnboardingContext';
import { slugifyName } from '@/lib/slugify';
import { athleteManageHref, athleteProfileHref, profileUrl } from '@/lib/profileUrl';
import { markPublished, useSession } from '@/lib/session';
import { ProgressBar } from '@/components/ui/ProgressBar';

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
  const {
    profile,
    mode,
    publish: publishToApi,
    publishChecklist,
    saveError,
    saving,
    draftSlug,
  } = useOnboarding();
  const { session, ready: sessionReady } = useSession();
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const confetti = useConfetti();

  const firstName = profile.name.trim().split(' ')[0] || 'Athlete';
  const hasName = profile.name.trim().length > 0;
  // In api mode the slug is the server-reserved one (it may carry a -2..-5 suffix
  // after a collision); mock keeps the name-derived slug.
  const slug = (mode === 'api' ? draftSlug : null) ?? (slugifyName(profile.name) || 'your-name');
  const profileRouteReady = mode === 'api' ? Boolean(draftSlug) : hasName;
  const manageHref = athleteManageHref(slug);
  const publicUrl = profileUrl(slug);
  const publishBlockedByAccount = mode === 'api' && (!sessionReady || !session);
  // Split so the button only renders as unavailable when something the athlete
  // must act on blocks it; an in-flight publish keeps the primary treatment and
  // shows the spinner instead.
  const blocked = !hasName || publishBlockedByAccount;
  const inFlight = status === 'publishing' || saving;

  const missing = [
    !profile.bio && 'your story',
    profile.personalBests.filter((best) => best.distance && best.time).length === 0 &&
      'personal bests',
    profile.values.length === 0 && 'values',
  ].filter((entry): entry is string => Boolean(entry));

  // Post-publish nudge: what's still worth adding so the profile reads as complete.
  const missingSections = [
    profile.careerHighlights.filter((item) => item.title.trim()).length === 0 && 'career highlights',
    profile.previousRaces.filter((item) => item.name.trim()).length === 0 && 'previous races',
  ].filter((entry): entry is string => Boolean(entry));

  const completionChecks = [
    hasName,
    Boolean(profile.bio.trim()),
    Boolean(profile.location.trim()),
    profile.personalBests.filter((best) => best.distance && best.time).length > 0,
    profile.values.length > 0,
    Boolean(profile.mission.trim()),
    profile.careerHighlights.filter((item) => item.title.trim()).length > 0,
    profile.previousRaces.filter((item) => item.name.trim()).length > 0,
  ];
  const completionPct = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100,
  );

  const publish = async () => {
    if (publishBlockedByAccount) {
      setError(true);
      return;
    }
    if (!agreed || !hasName) {
      setError(true);
      return;
    }
    if (mode === 'api') {
      setStatus('publishing');
      const published = await publishToApi();
      if (published) {
        markPublished();
        setStatus('published');
      } else {
        // The guard checklist / save error renders below; return to idle so the
        // athlete can fix what's missing and publish again.
        setStatus('idle');
      }
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

        <div className="relative mx-auto flex min-h-full max-w-lg flex-col items-center justify-center px-5 py-12 text-center sm:py-16">
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

          {missingSections.length > 0 ? (
            <div className="mt-8 w-full rounded-card border-2 border-primary bg-primary-soft p-6 text-left shadow-xl shadow-primary/15">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl font-extrabold text-on-surface">
                  Make it stronger
                </h2>
                <span className="label-bold shrink-0 text-on-surface">
                  {completionPct}% complete
                </span>
              </div>
              <ProgressBar
                percent={completionPct}
                tone="primary"
                trackColorClassName="bg-white/70"
                className="mt-3"
              />
              <p className="mt-4 text-base leading-relaxed text-on-surface">
                Still to add: <strong>{missingSections.join(', ')}</strong>. Profiles with a full
                race history get followed — and backed — far more often.
              </p>
              <a
                href={manageHref}
                className="mt-4 inline-flex items-center gap-2 rounded-button bg-primary px-6 py-3 font-display text-base font-bold text-on-primary shadow-lg shadow-primary/25 transition-all hover:bg-primary-strong active:scale-95"
              >
                Finish your profile
                <Icon name="arrow-forward" className="h-5 w-5" />
              </a>
            </div>
          ) : null}

          <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="label-bold flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 text-on-primary transition-all hover:bg-primary-strong active:scale-95"
            >
              Go to your dashboard
              <Icon name="arrow-forward" className="h-5 w-5" />
            </Link>
            <a
              href={profileRouteReady ? athleteProfileHref(slug) : '/athletes'}
              className="label-bold flex flex-1 items-center justify-center rounded-lg border-2 border-outline px-6 py-4 text-on-surface transition-all hover:bg-surface-container"
            >
              {profileRouteReady ? 'View your profile' : 'Explore the network'}
            </a>
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-card border border-outline-variant bg-surface-container-low p-5">
        <h3 className="label-bold text-on-surface">What publishing does</h3>
        <p className="mt-2 flex items-center gap-2 text-sm text-on-surface-variant">
          <Icon name="link" className="h-4 w-4 shrink-0 text-secondary" />
          <span className="truncate">{publicUrl}</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-on-surface-variant">
          <li className="flex gap-2">
            <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            It becomes a public page anyone can open.
          </li>
          <li className="flex gap-2">
            <Icon name="instagram" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Put this link in your Instagram bio.
          </li>
          <li className="flex gap-2">
            <Icon name="pencil" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Keep editing after it is live.
          </li>
        </ul>
        <p className="mt-4 text-xs text-on-surface-variant">
          Your public profile also includes IG Story and Post share-card exports once it is live.
        </p>
      </section>
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
          I agree to the{' '}
          <Link
            href="/terms#transparency"
            target="_blank"
            onClick={(event) => event.stopPropagation()}
            className="text-secondary underline hover:text-primary"
          >
            Radical Transparency guidelines
          </Link>
        </label>
      </div>
      {!hasName ? (
        <p className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error">
          Add your name in{' '}
          <Link href="/register/personal-basics?from=review" className="underline">
            Step 1
          </Link>{' '}
          before publishing.
        </p>
      ) : mode === 'mock' && missing.length > 0 ? (
        <p className="text-xs text-on-surface-variant">
          Still missing {missing.join(', ')} — you can add them after publishing.
        </p>
      ) : null}
      {mode === 'api' && !sessionReady ? (
        <p
          role="status"
          className="rounded-input bg-primary-container/20 px-4 py-3 text-sm font-semibold text-on-surface"
        >
          Checking your account before publishing.
        </p>
      ) : mode === 'api' && !session ? (
        <p
          role="alert"
          className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error"
        >
          Sign in before publishing your profile.
        </p>
      ) : mode === 'api' && session?.mustVerifyEmail ? (
        <div className="rounded-input border border-secondary/30 bg-secondary-soft/40 px-4 py-4 text-sm">
          <p className="font-bold text-on-surface">Verify your email when you get a chance</p>
          <p className="mt-1 text-on-surface-variant">
            Publishing works either way. Verifying keeps account recovery secure.
          </p>
          <Link
            href="/verify-email"
            className="mt-3 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
          >
            Send the verification email
            <Icon name="arrow-forward" className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
      {mode === 'api' && publishChecklist.length > 0 ? (
        <div
          role="alert"
          className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error"
        >
          <p>Before you can publish, finish these:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 font-normal">
            {publishChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : mode === 'api' && saveError ? (
        <p
          role="alert"
          className="rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error"
        >
          {saveError}
        </p>
      ) : null}
      <button
        type="button"
        onClick={publish}
        disabled={inFlight || blocked}
        className={`flex w-full items-center justify-center gap-3 rounded-lg py-4 font-display text-xl font-bold transition-all sm:text-2xl ${
          blocked
            ? 'cursor-not-allowed bg-surface-container-high text-on-surface-variant'
            : 'bg-secondary-container text-on-secondary-container shadow-lg shadow-secondary/20 hover:bg-on-surface active:scale-95 disabled:opacity-80'
        }`}
      >
        {status === 'publishing' ? (
          <>
            <Icon name="sync" className="h-6 w-6 animate-spin" />
            Publishing...
          </>
        ) : publishBlockedByAccount ? (
          <>
            <Icon name="lock" className="h-6 w-6" />
            Verify email to publish
          </>
        ) : (
          <>
            Publish my profile
            <Icon name="rocket" className="h-6 w-6" />
          </>
        )}
      </button>
      <p className="text-center text-xs text-on-surface-variant">
        Publish when your tagline and first personal best are ready; the link stays editable.
      </p>
    </div>
  );
}
