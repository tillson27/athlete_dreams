'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { AthleteProfile } from 'fad-common';
import { useSession, signOut, type Session } from '@/lib/session';
import { DATA_SOURCE } from '@/lib/dataSource';
import { findMockAthlete } from '@/lib/mockAthletes';
import { slugifyName } from '@/lib/slugify';
import { athleteManageHref, athleteProfileHref, profileUrl } from '@/lib/profileUrl';
import { loadEdits, subscribeToEdits, type AthleteEdits } from '@/lib/athleteEdits';
import { fetchMyProfile, ApiError } from '@/lib/api';
import { OnboardingProvider, useOnboarding } from '@/app/register/_components/OnboardingContext';
import { ProfilePreview } from '@/app/register/_components/ProfilePreview';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';

type ChecklistItem = { label: string; done: boolean; href: string; cta: string };
type PublicSectionCompletion = {
  hasHighlight: boolean;
  hasRace: boolean;
  hasRoadmap: boolean;
  hasGallery: boolean;
};

const EMPTY_PUBLIC_SECTION_COMPLETION: PublicSectionCompletion = {
  hasHighlight: false,
  hasRace: false,
  hasRoadmap: false,
  hasGallery: false,
};

export function DashboardClient() {
  const { session, ready } = useSession();

  if (!ready) {
    return <DashboardLoading />;
  }

  if (!session) {
    return <SignedOutGate />;
  }

  if (DATA_SOURCE === 'api') {
    return <DashboardApi session={session} />;
  }

  return (
    <OnboardingProvider>
      <DashboardInner session={session} />
    </OnboardingProvider>
  );
}

function DashboardLoading() {
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

// --- Mock mode: today's onboarding-store-backed dashboard, unchanged ---

function DashboardInner({ session }: { session: Session }) {
  const { profile } = useOnboarding();
  const [copied, setCopied] = useState(false);

  const displayName = profile.name || session.name;
  const firstName = displayName.trim().split(' ')[0] || 'there';
  const slug = slugifyName(displayName) || 'your-name';
  const profileExists = Boolean(findMockAthlete(slug));
  const profileCanOpen = profileExists || session.published;
  const profileHref = profileCanOpen ? athleteProfileHref(slug) : '#profile-preview';
  const manageHref = athleteManageHref(slug);
  const publicUrl = profileUrl(slug);

  const [editCompletion, setEditCompletion] = useState<PublicSectionCompletion>(
    EMPTY_PUBLIC_SECTION_COMPLETION
  );
  useEffect(() => {
    const sync = () => setEditCompletion(sectionCompletionFromEdits(loadEdits(slug)));
    sync();
    return subscribeToEdits(slug, sync);
  }, [slug]);

  const filledBests = profile.personalBests.filter((best) => best.distance && best.time);
  const publicSections = mergeSectionCompletion(
    sectionCompletionFromOnboarding(profile),
    editCompletion
  );
  const checklist: ChecklistItem[] = [
    { label: 'Write your story', done: Boolean(profile.bio), href: '/register/personal-basics?from=review', cta: 'Add bio' },
    { label: 'Add personal bests', done: filledBests.length > 0, href: '/register/athletics?from=review', cta: 'Add bests' },
    { label: 'Pick your values', done: profile.values.length > 0, href: '/register/values-social?from=review', cta: 'Add values' },
    { label: 'Write a tagline', done: Boolean(profile.mission), href: '/register/values-social?from=review', cta: 'Add tagline' },
    {
      label: 'Add highlights, races, roadmap & photos',
      done: isPublicSectionComplete(publicSections),
      href: manageHref,
      cta: 'Open editor',
    },
  ];

  const copyLink = makeCopyLink(publicUrl, setCopied);

  return (
    <DashboardView
      firstName={firstName}
      published={session.published}
      draftCtaHref="/register/review"
      profileExists={profileCanOpen}
      profileHref={profileHref}
      manageHref={manageHref}
      publicUrl={publicUrl}
      mustVerifyEmail={false}
      checklist={checklist}
      copied={copied}
      copyLink={copyLink}
      profileCard={<ProfilePreview sticky={false} showMeta={false} />}
    />
  );
}

// --- Api mode: identity from the session, profile state from GET /v1/athletes/me ---

type ApiProfileState =
  | { kind: 'loading' }
  | { kind: 'none' }
  | { kind: 'error' }
  | { kind: 'ready'; profile: AthleteProfile };

function DashboardApi({ session }: { session: Session }) {
  const [state, setState] = useState<ApiProfileState>({ kind: 'loading' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setState({ kind: 'loading' });
    fetchMyProfile()
      .then((profile) => {
        if (active) setState({ kind: 'ready', profile });
      })
      .catch((error: unknown) => {
        if (!active) return;
        // 404 = the signed-in user has not created a profile yet (Context §11).
        setState(
          error instanceof ApiError && error.status === 404 ? { kind: 'none' } : { kind: 'error' }
        );
      });
    return () => {
      active = false;
    };
  }, []);

  if (state.kind === 'loading') return <DashboardLoading />;
  if (state.kind === 'none') return <NoProfileGate firstName={firstNameOf(session.name)} />;
  if (state.kind === 'error') return <ProfileErrorGate firstName={firstNameOf(session.name)} />;

  const { profile } = state;
  const published = Boolean(profile.publishedAt);
  const slug = profile.athleteSlug;
  const profileHref = published ? athleteProfileHref(slug) : '#profile-preview';
  const manageHref = athleteManageHref(slug);
  const publicUrl = profileUrl(slug);
  const checklist = deriveApiChecklist(profile, manageHref);
  const copyLink = makeCopyLink(publicUrl, setCopied);

  return (
    <DashboardView
      firstName={firstNameOf(profile.fullName || session.name)}
      published={published}
      draftCtaHref="/register/review"
      profileExists={published}
      profileHref={profileHref}
      manageHref={manageHref}
      publicUrl={publicUrl}
      mustVerifyEmail={session.mustVerifyEmail}
      checklist={checklist}
      copied={copied}
      copyLink={copyLink}
      profileCard={<ApiProfileSummary profile={profile} />}
    />
  );
}

// Real-field completeness (Context §7): derived from the persisted profile
// instead of the onboarding store. The public-section row is satisfied only
// when the profile sections that render on the public page have actual content.
function deriveApiChecklist(profile: AthleteProfile, manageHref: string): ChecklistItem[] {
  const hasStory = Boolean(profile.storyBody && profile.storyBody.length > 0);
  const hasBests = (profile.personalBests?.length ?? 0) > 0;
  const hasValues = profile.values.length > 0;
  const hasTagline = Boolean(profile.storyIntro);
  const hasPublicSections = isPublicSectionComplete({
    hasHighlight: profile.accomplishments.length > 0,
    hasRace: (profile.raceResults?.length ?? 0) > 0,
    hasRoadmap: (profile.roadmap?.length ?? 0) > 0,
    hasGallery: (profile.gallery?.length ?? 0) > 0,
  });
  return [
    { label: 'Write your story', done: hasStory, href: '/register/personal-basics?from=review', cta: 'Add bio' },
    { label: 'Add personal bests', done: hasBests, href: '/register/athletics?from=review', cta: 'Add bests' },
    { label: 'Pick your values', done: hasValues, href: '/register/values-social?from=review', cta: 'Add values' },
    { label: 'Write a tagline', done: hasTagline, href: '/register/values-social?from=review', cta: 'Add tagline' },
    {
      label: 'Add highlights, races, roadmap & photos',
      done: hasPublicSections,
      href: manageHref,
      cta: 'Open editor',
    },
  ];
}

function sectionCompletionFromEdits(edits: AthleteEdits | null): PublicSectionCompletion {
  if (!edits) return EMPTY_PUBLIC_SECTION_COMPLETION;
  return {
    hasHighlight: edits.highlights.some((highlight) => highlight.title.trim()),
    hasRace: edits.races.some((race) => race.name.trim()),
    hasRoadmap: edits.roadmap.some((event) => event.name.trim() && event.date.trim()),
    hasGallery: edits.gallery.length > 0,
  };
}

function sectionCompletionFromOnboarding(
  profile: ReturnType<typeof useOnboarding>['profile']
): PublicSectionCompletion {
  return {
    hasHighlight: profile.careerHighlights.some((highlight) => highlight.title.trim()),
    hasRace: profile.previousRaces.some((race) => race.name.trim()),
    hasRoadmap: false,
    hasGallery: false,
  };
}

function mergeSectionCompletion(
  first: PublicSectionCompletion,
  second: PublicSectionCompletion
): PublicSectionCompletion {
  return {
    hasHighlight: first.hasHighlight || second.hasHighlight,
    hasRace: first.hasRace || second.hasRace,
    hasRoadmap: first.hasRoadmap || second.hasRoadmap,
    hasGallery: first.hasGallery || second.hasGallery,
  };
}

function isPublicSectionComplete(completion: PublicSectionCompletion): boolean {
  return completion.hasHighlight && completion.hasRace && completion.hasRoadmap && completion.hasGallery;
}

function ApiProfileSummary({ profile }: { profile: AthleteProfile }) {
  const discipline = profile.disciplineLabel ?? '';
  const tagline = profile.storyIntro ?? '';
  return (
    <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-6">
      <p className="font-display text-xl font-bold text-on-surface">{profile.fullName}</p>
      {discipline ? <p className="mt-1 text-sm text-on-surface-variant">{discipline}</p> : null}
      {profile.hometown ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-on-surface-variant">
          <Icon name="location" className="h-4 w-4 shrink-0" />
          {profile.hometown}
        </p>
      ) : null}
      {tagline ? <p className="mt-4 text-sm text-on-surface">{tagline}</p> : null}
      {profile.values.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.values.map((value) => (
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
  );
}

// --- Shared dashboard view (identical body for both modes) ---

function DashboardView({
  firstName,
  published,
  draftCtaHref,
  profileExists,
  profileHref,
  manageHref,
  publicUrl,
  mustVerifyEmail,
  checklist,
  copied,
  copyLink,
  profileCard,
}: {
  firstName: string;
  published: boolean;
  draftCtaHref: string;
  profileExists: boolean;
  profileHref: string;
  manageHref: string;
  publicUrl: string;
  mustVerifyEmail: boolean;
  checklist: ChecklistItem[];
  copied: boolean;
  copyLink: () => void;
  profileCard: ReactNode;
}) {
  const completedCount = checklist.filter((item) => item.done).length;
  const completeness = Math.round((completedCount / checklist.length) * 100);
  const showChecklist = completedCount < checklist.length;

  return (
    <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-12 md:px-16">
      {/* Header */}
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span
            className={`mb-3 inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-bold ${
              published ? 'bg-success/15 text-success' : 'bg-primary-container/20 text-primary'
            }`}
          >
            <Icon name={published ? 'check-circle' : 'history'} className="h-4 w-4" />
            {published ? 'Profile live' : 'Draft — not published yet'}
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
          {mustVerifyEmail ? (
            <div className="flex flex-col items-start gap-3 rounded-card border border-primary/30 bg-primary-container/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-on-surface">
                Verify your email before publishing your profile to the network.
              </p>
              <Link
                href="/verify-email"
                className="label-bold shrink-0 rounded-lg bg-primary px-5 py-2.5 text-on-primary transition-all hover:bg-primary-strong"
              >
                Resend verification
              </Link>
            </div>
          ) : null}

          {/* Draft banner */}
          {!published ? (
            <div className="flex flex-col items-start gap-3 rounded-card border border-primary/30 bg-primary-container/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-on-surface">
                Your profile isn&rsquo;t live yet. Finish the last step to publish it to the network.
              </p>
              <Link
                href={draftCtaHref}
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
              <ActionTile
                icon="person"
                title="View profile"
                subtitle={profileExists ? 'See your public page' : 'Preview your page below'}
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

          {showChecklist ? (
            <section className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-on-surface">Finish your profile</h2>
                <span className="label-bold text-primary">{completeness}%</span>
              </div>
              <ProgressBar percent={completeness} className="mb-6" />
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
                      <RuntimeAwareLink
                        href={item.href}
                        className="label-bold shrink-0 text-secondary hover:underline"
                      >
                        {item.cta}
                      </RuntimeAwareLink>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* Right column — the profile card */}
        <div className="lg:col-span-4">
          <div id="profile-preview" className="sticky top-24 scroll-mt-24 space-y-4">
            {profileCard}
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

function firstNameOf(name: string): string {
  return name.trim().split(' ')[0] || 'there';
}

function makeCopyLink(publicUrl: string, setCopied: (value: boolean) => void) {
  return async () => {
    try {
      await navigator.clipboard.writeText(`https://${publicUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — link is still visible to copy manually */
    }
  };
}

function RuntimeAwareLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (href.startsWith('/athletes/')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
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
  const className =
    'flex flex-col items-start gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-4 transition-all hover:border-secondary active:scale-[0.98]';
  if (href.startsWith('/athletes/')) {
    return (
      <a href={href} className={className}>
        <Icon name={icon} className="h-6 w-6 text-primary" />
        <span className="label-bold text-on-surface">{title}</span>
        <span className="text-xs text-on-surface-variant">{subtitle}</span>
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
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

// Signed in with no profile yet (api-mode `GET /v1/athletes/me` 404): route into
// onboarding to create one (Context §11).
function NoProfileGate({ firstName }: { firstName: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-5 py-16 text-center">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container/20 text-primary">
          <Icon name="rocket" className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-extrabold text-on-surface">
          Welcome, {firstName}. Let&rsquo;s build your page.
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          You don&rsquo;t have an athlete profile yet. It takes about five minutes to tell your story.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/register"
            className="label-bold rounded-lg bg-primary px-6 py-3 text-on-primary transition-all hover:bg-primary-strong"
          >
            Start your story
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProfileErrorGate({ firstName }: { firstName: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-5 py-16 text-center">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container/20 text-primary">
          <Icon name="history" className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-extrabold text-on-surface">
          We couldn&rsquo;t load your dashboard, {firstName}.
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Something went wrong reaching your profile. Please refresh to try again.
        </p>
      </div>
    </div>
  );
}
