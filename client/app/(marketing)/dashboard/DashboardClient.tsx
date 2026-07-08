'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut, type Session } from '@/lib/session';
import { findMockAthlete } from '@/lib/mockAthletes';
import { OnboardingProvider, useOnboarding } from '@/app/register/_components/OnboardingContext';
import { ProfilePreview } from '@/app/register/_components/ProfilePreview';
import { Icon, type IconName } from '@/components/ui/Icon';

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

  if (!session) {
    return <SignedOutGate />;
  }

  return (
    <OnboardingProvider>
      <DashboardInner session={session} />
    </OnboardingProvider>
  );
}

function DashboardInner({ session }: { session: Session }) {
  const { profile } = useOnboarding();
  const [copied, setCopied] = useState(false);

  const displayName = profile.name || session.name;
  const firstName = displayName.trim().split(' ')[0] || 'there';
  const slug =
    displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'your-name';
  const profileExists = Boolean(findMockAthlete(slug));
  const profileHref = profileExists ? `/athletes/${slug}` : '/athletes';
  const manageHref = profileExists
    ? `/athletes/${slug}/manage`
    : '/athletes/cassandra-de-winter/manage';
  const publicUrl = `arc.network/athletes/${slug}`;

  const filledBests = profile.personalBests.filter((best) => best.distance && best.time);
  const checklist: { label: string; done: boolean; href: string; cta: string }[] = [
    { label: 'Write your story', done: Boolean(profile.bio), href: '/register/personal-basics?from=review', cta: 'Add bio' },
    { label: 'Add personal bests', done: filledBests.length > 0, href: '/register/athletics?from=review', cta: 'Add bests' },
    { label: 'Pick your values', done: profile.values.length > 0, href: '/register/values-social?from=review', cta: 'Add values' },
    { label: 'Write a tagline', done: Boolean(profile.mission), href: '/register/values-social?from=review', cta: 'Add tagline' },
    { label: 'Add career highlights & previous races', done: false, href: manageHref, cta: 'Open editor' },
  ];
  const completedCount = checklist.filter((item) => item.done).length;
  const completeness = Math.round((completedCount / checklist.length) * 100);

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
      {/* Header */}
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className={`mb-3 inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-bold ${
              session.published
                ? 'bg-success/15 text-success'
                : 'bg-primary-container/20 text-primary'
            }`}
          >
            <Icon name={session.published ? 'check-circle' : 'history'} className="h-4 w-4" />
            {session.published ? 'Profile live' : 'Draft — not published yet'}
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
        {/* Left column */}
        <div className="space-y-6 lg:col-span-8">
          {/* Draft banner */}
          {!session.published ? (
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

          {/* Quick actions */}
          <section className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6">
            <h2 className="mb-4 font-display text-xl font-bold text-on-surface">Quick actions</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ActionTile icon="person" title="View profile" subtitle="See your public page" href={profileHref} />
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

          {/* Completeness + checklist */}
          <section className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-on-surface">Finish your profile</h2>
              <span className="label-bold text-primary">{completeness}%</span>
            </div>
            <div className="mb-6 h-2.5 w-full overflow-hidden rounded-pill bg-surface-container">
              <div
                className="progress-gradient h-full rounded-pill transition-all"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/50 p-3"
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        item.done ? 'bg-success text-white' : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {item.done ? <Icon name="check" className="h-4 w-4" /> : null}
                    </span>
                    <span className={item.done ? 'text-on-surface-variant line-through' : 'text-on-surface'}>
                      {item.label}
                    </span>
                  </span>
                  {!item.done ? (
                    <Link href={item.href} className="label-bold shrink-0 text-secondary hover:underline">
                      {item.cta}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right column — the profile card */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <ProfilePreview sticky={false} showMeta={false} />
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
