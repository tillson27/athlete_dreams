'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AthleteProfileStatus, type AthleteDashboard, type AthleteProfileDraft } from 'fad-common';
import { getMyDashboard } from '@/lib/api/athletes';
import { formatSport } from '@/lib/format';
import { useSession, signOut } from '@/lib/session';
import { profileUrl } from '@/lib/profileUrl';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&w=900&q=70';

export function DashboardClient() {
  const { session, ready } = useSession();

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-12 md:px-16">
        <div className="h-8 w-40 animate-pulse rounded-pill bg-surface-container" />
        <div className="mt-4 h-10 w-72 animate-pulse rounded-input bg-surface-container" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-64 animate-pulse rounded-card bg-surface-container lg:col-span-8" />
          <div className="h-64 animate-pulse rounded-card bg-surface-container lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (!session?.accessToken) {
    return <SignedOutGate />;
  }

  return <DashboardLoader accessToken={session.accessToken} />;
}

function DashboardLoader({ accessToken }: { accessToken: string }) {
  const [dashboard, setDashboard] = useState<AthleteDashboard | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyDashboard(accessToken)
      .then((result) => {
        if (!cancelled) setDashboard(result);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (failed) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-16 text-center">
        <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
          <Icon name="help" className="mx-auto h-10 w-10 text-error" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-on-surface">
            Dashboard unavailable
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            We couldn&rsquo;t load your profile data. Try signing in again.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="label-bold mt-6 rounded-lg bg-primary px-6 py-3 text-on-primary transition-all hover:bg-primary-strong"
          >
            Sign in again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-12 md:px-16">
        <div className="h-8 w-40 animate-pulse rounded-pill bg-surface-container" />
        <div className="mt-4 h-10 w-72 animate-pulse rounded-input bg-surface-container" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-64 animate-pulse rounded-card bg-surface-container lg:col-span-8" />
          <div className="h-64 animate-pulse rounded-card bg-surface-container lg:col-span-4" />
        </div>
      </div>
    );
  }

  return <DashboardInner dashboard={dashboard} />;
}

function DashboardInner({ dashboard }: { dashboard: AthleteDashboard }) {
  const [copied, setCopied] = useState(false);

  const displayName = dashboard.fullName;
  const firstName = displayName.trim().split(' ')[0] || 'there';
  const profileHref = dashboard.publicProfileUrl ?? '#profile-preview';
  const manageHref = dashboard.manageProfileUrl ?? '/register';
  const publicUrl = dashboard.athleteSlug ? profileUrl(dashboard.athleteSlug) : 'athletearc.ca/athletes/your-name';
  const isPublished = dashboard.profileStatus === AthleteProfileStatus.Published;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — link is still visible to copy manually */
    }
  };

  return (
    <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-12 md:px-16">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className={`mb-3 inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-bold ${
              isPublished
                ? 'bg-success/15 text-success'
                : 'bg-primary-container/20 text-primary'
            }`}
          >
            <Icon name={isPublished ? 'check-circle' : 'history'} className="h-4 w-4" />
            {isPublished ? 'Profile live' : 'Draft — not published yet'}
          </span>
          <h1 className="font-display text-4xl font-extrabold text-on-surface">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-1 text-lg text-on-surface-variant">
            Your home base — manage your story, share it, and keep it growing.
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="label-bold self-start rounded-lg border border-outline-variant px-4 py-2.5 text-on-surface-variant transition-colors hover:border-error hover:text-error sm:self-auto"
        >
          Sign out
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {!isPublished ? (
            <div className="flex flex-col items-start gap-3 rounded-card border border-primary/30 bg-primary-container/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-on-surface">
                Your profile isn&rsquo;t live yet. Finish the last step to publish it to the network.
              </p>
              <Link
                href="/register/review"
                className="label-bold shrink-0 rounded-lg bg-primary px-5 py-2.5 text-on-primary transition-all hover:bg-primary-strong"
              >
                Finish &amp; publish
              </Link>
            </div>
          ) : null}
          <section className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-4 font-display text-xl font-bold text-on-surface">Quick actions</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ActionTile
                icon="person"
                title="View profile"
                subtitle={isPublished ? 'See your public page' : 'Preview your page below'}
                href={profileHref}
              />
              <ActionTile icon="trophy" title="Edit profile" subtitle="Highlights & races" href={manageHref} />
              <button
                type="button"
                onClick={copyLink}
                className="flex flex-col items-start gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-4 text-left transition-all hover:border-secondary active:scale-[0.98]"
              >
                <Icon name={copied ? 'check' : 'link'} className="h-6 w-6 text-primary" />
                <span className="label-bold text-on-surface">{copied ? 'Copied!' : 'Share link'}</span>
                <span className="text-xs text-on-surface-variant">{copied ? 'Link copied' : 'Copy your URL'}</span>
              </button>
            </div>
          </section>
          <section className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-on-surface">Finish your profile</h2>
              <span className="label-bold text-primary">{dashboard.completion.completionPercent}%</span>
            </div>
            <ProgressBar percent={dashboard.completion.completionPercent} className="mb-6" />
            <ul className="space-y-2">
              {dashboard.completion.items.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/50 p-3"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        item.isComplete ? 'bg-success text-white' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {item.isComplete ? <Icon name="check" className="h-4 w-4" /> : null}
                    </span>
                    <span className={item.isComplete ? 'text-on-surface-variant line-through' : 'text-on-surface'}>
                      {item.label}
                    </span>
                  </span>
                  {!item.isComplete ? (
                    <Link
                      href={item.href ?? manageHref}
                      className="label-bold shrink-0 text-secondary hover:underline"
                    >
                      {item.ctaLabel ?? 'Update'}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="lg:col-span-4">
          <div id="profile-preview" className="sticky top-24 scroll-mt-24 space-y-4">
            <DashboardProfilePreview draft={dashboard.draft} />
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-2 pl-4">
              <Icon name="link" className="h-5 w-5 shrink-0 text-on-surface-variant" />
              <span className="flex-1 truncate text-sm text-on-surface-variant">{publicUrl}</span>
              <button
                type="button"
                onClick={copyLink}
                className="label-bold shrink-0 rounded-md bg-surface-container px-3 py-1.5 text-on-surface transition-all hover:bg-surface-container-high"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionTile({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-start gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-4 transition-all hover:border-secondary active:scale-[0.98]"
    >
      <Icon name={icon} className="h-6 w-6 text-primary" />
      <span className="label-bold text-on-surface">{title}</span>
      <span className="text-xs text-on-surface-variant">{subtitle}</span>
    </Link>
  );
}

function DashboardProfilePreview({ draft }: { draft: AthleteProfileDraft }) {
  const heroImage = draft.heroMediaUrl ?? draft.profileImageUrl ?? FALLBACK_IMAGE;
  const displayName = draft.fullName ?? 'Your name';
  const discipline = draft.disciplineLabel ?? (draft.primarySport ? formatSport(draft.primarySport) : 'Runner');
  const headline = draft.headline ?? draft.tagline ?? 'Your athlete story will appear here.';
  const values = draft.coreValues.length
    ? draft.coreValues.map((value) => value.title)
    : draft.values;

  return (
    <article className="card-lift overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest">
      <div className="relative aspect-[4/3] bg-surface-container">
        <Image
          src={heroImage}
          alt={`${displayName} preview`}
          fill
          unoptimized
          sizes="(max-width: 1024px) 100vw, 360px"
          className="object-cover"
        />
      </div>
      <div className="p-5">
        <p className="label-bold text-secondary">{discipline}</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-on-surface">{displayName}</h2>
        <p className="mt-2 text-sm text-on-surface-variant">{headline}</p>
        {values.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {values.slice(0, 3).map((value) => (
              <span
                key={value}
                className="rounded-pill bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant"
              >
                {value}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function SignedOutGate() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-5 py-16 text-center">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container/20 text-primary">
          <Icon name="lock" className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-extrabold text-on-surface">Sign in to your dashboard</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Your dashboard is where you manage and share your athlete profile.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/sign-in"
            className="label-bold rounded-lg bg-primary px-6 py-3 text-on-primary transition-all hover:bg-primary-strong"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="label-bold rounded-lg border-2 border-outline px-6 py-3 text-on-surface transition-all hover:bg-surface-container"
          >
            Start your story
          </Link>
        </div>
      </div>
    </div>
  );
}
