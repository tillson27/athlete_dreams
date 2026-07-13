import Image from 'next/image';
import Link from 'next/link';
import type { MockAthlete } from '@/lib/mockAthletes';
import type { RichAthleteProfile } from '@/lib/athleteProfiles';
import { deriveEdits } from '@/lib/prototype/athleteEdits';
import { formatCents } from '@/lib/format';
import { profileUrl } from '@/lib/profileUrl';
import { ArrowGlyph } from '@/components/ui/Button';
import { FollowButton } from '@/components/site/FollowButton';
import { ShareCard, type ShareResume } from './ShareCard';
import { Icon, type IconName } from '@/components/ui/Icon';
import { unsplashPhoto } from '@/lib/unsplash';
import { ProfileTabNav } from './ProfileTabNav';
import { OwnerManageLink } from './OwnerManageLink';
import {
  EditedHighlights,
  EditedRaces,
  EditedRoadmap,
  EditedGallery,
} from './ProfileEditableSections';

const profileTabs = [
  { label: 'Story', href: '#story' },
  { label: 'The Arc', href: '#arc' },
  { label: 'Results', href: '#results' },
  { label: 'Training', href: '#training' },
  { label: 'Gallery', href: '#gallery' },
];

const verifiedProofs = [
  {
    title: 'Official results',
    body: 'Results earn a verified badge when linked to an official, public results page.',
  },
  {
    title: 'Receipts on funded expenses',
    body: 'When backing opens, every campaign is itemized and expenses are proven with receipts.',
  },
  {
    title: 'Post-event updates',
    body: 'Athletes share recaps after key events, so supporters see the outcome.',
  },
];

const chapterTone: Record<'secondary' | 'tertiary' | 'primary', string> = {
  secondary: 'bg-secondary',
  tertiary: 'bg-tertiary',
  primary: 'bg-primary',
};

export function AthleteProfile({
  athlete,
  profile,
}: {
  athlete: MockAthlete;
  profile: RichAthleteProfile;
}) {
  const firstName = athlete.fullName.split(' ')[0];
  const isCyclist = athlete.primarySport === 'ROAD_CYCLING';
  const peerNoun = isCyclist ? 'Riders' : 'Runners';
  const sportNoun = isCyclist ? 'cycling' : 'running';
  const supportersCount = profile.supporterCount ?? 0;
  const editDefaults = deriveEdits(profile);

  const shareResume: ShareResume = {
    name: athlete.fullName,
    tagline: profile.disciplineLabel,
    location: athlete.hometown,
    photo: athlete.heroMediaUrl,
    highlights: [...profile.careerHighlights, ...profile.moreResults].map(
      (highlight) => `${highlight.title} — ${highlight.detail}`,
    ),
    previousRaces: [...profile.previousRaces, ...profile.morePreviousRaces].map(
      (race) => `${race.name} — ${race.result}`,
    ),
    stats: profile.personalBests.map((best) => ({ label: best.label, value: best.value })),
    url: profileUrl(athlete.athleteSlug),
  };

  return (
    <div className="pb-40 md:pb-16">
      <section className="relative h-[46vh] min-h-[360px] w-full overflow-hidden md:h-[70vh] md:min-h-0">
        <Image
          src={athlete.heroMediaUrl}
          alt={`${athlete.fullName} — ${profile.disciplineLabel}`}
          fill
          priority
          sizes="100vw"
          className="ken-burns object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#140b08]/88 via-[#160d09]/35 to-[#160d09]/5 md:from-[#140b08]/78 md:via-[#160d09]/20"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(120% 100% at 50% 30%, transparent 45%, rgba(9,5,3,0.6) 100%)',
          }}
        />
        <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-8 text-white md:px-16 md:py-12">
          <span className="mb-3 inline-flex items-center gap-1 rounded-pill bg-success px-3 py-1 text-xs font-bold tracking-[0.05em] text-white">
            <Icon name="check-badge" className="h-4 w-4" />
            Verified Athlete
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.02] tracking-tight drop-shadow-sm md:text-6xl lg:text-7xl">
            {athlete.fullName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-white/90">
            <p className="eyebrow inline-flex items-center gap-1">
              <Icon name="trail" className="h-4 w-4" />
              {profile.disciplineLabel}
            </p>
            <span className="hidden h-1 w-1 rounded-full bg-white/50 md:block" />
            <p className="eyebrow inline-flex items-center gap-1">
              <Icon name="location" className="h-4 w-4" />
              {athlete.hometown}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-4">
              <span className="label-bold text-white/80">{profile.handle}</span>
              <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />
              <p className="text-white/70">
                <span className="font-display text-lg font-bold text-white">
                  {profile.followers}
                </span>{' '}
                <span className="label-bold">followers</span>
              </p>
            </div>
            <FollowButton slug={athlete.athleteSlug} variant="hero" />
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
        <ProfileTabNav tabs={profileTabs} />
        <section className="relative z-10 -mt-12 hidden md:block">
          <div className="card-lift flex flex-col items-center justify-center gap-4 rounded-card bg-surface-container-lowest p-6 md:flex-row md:justify-end md:p-8">
            <div className="flex w-full flex-col gap-4 md:w-auto md:flex-row">
              {profile.supportEnabled ? (
                <Link
                  href="/support"
                  className="inline-flex min-h-12 items-center justify-center rounded-button bg-primary-container px-8 py-4 text-sm font-bold text-on-primary shadow-md transition-all hover:bg-primary active:scale-95"
                >
                  Back this athlete
                </Link>
              ) : (
                <FollowButton slug={athlete.athleteSlug} variant="block" className="md:w-auto md:px-8" />
              )}
              <ShareCard resume={shareResume} />
              <OwnerManageLink athleteSlug={athlete.athleteSlug} />
            </div>
          </div>
        </section>
        <details className="group mt-6 overflow-hidden rounded-card border border-success/30 bg-success/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 md:p-5">
            <span className="flex items-center gap-2.5 text-sm font-semibold text-on-surface">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success text-white">
                <Icon name="check-badge" className="h-4 w-4" />
              </span>
              <span>
                Verified results
                <span className="hidden font-normal text-on-surface-variant sm:inline">
                  {' '}
                  · linked to official results pages
                </span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-secondary">
              How we verify
              <Icon name="chevron" className="h-4 w-4 transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div className="grid gap-3 border-t border-success/20 p-4 sm:grid-cols-3 md:p-5">
            {verifiedProofs.map((proof) => (
              <div
                key={proof.title}
                className="flex items-start gap-2.5 rounded-input bg-surface-container-lowest p-3"
              >
                <Icon name="check-badge" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <div>
                  <p className="label-bold text-on-surface">{proof.title}</p>
                  <p className="mt-0.5 text-xs text-on-surface-variant">{proof.body}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
        <details id="arc" open className="group mt-8 scroll-mt-32 md:mt-16">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="eyebrow text-primary">The Arc</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-on-surface md:text-4xl">
                {firstName}&rsquo;s journey
              </h2>
              <p className="mt-3 text-on-surface-variant">{profile.arcSubtitle}</p>
            </div>
            <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant text-on-surface-variant transition-transform group-open:rotate-180">
              <Icon name="chevron" className="h-5 w-5" />
            </span>
          </summary>

          <ol className="relative mt-10">
            <span
              aria-hidden="true"
              className="absolute bottom-8 left-[19px] top-3 w-0.5 rounded-full bg-gradient-to-b from-secondary via-primary to-primary-container"
            />
            {profile.arcChapters.map((chapter) => (
              <li key={chapter.title} className="relative flex gap-5 pb-8 last:pb-0">
                <span
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ring-4 ring-surface ${chapterTone[chapter.tone]} ${
                    chapter.current ? 'shadow-lg shadow-primary/30' : ''
                  }`}
                >
                  <Icon name={chapter.icon} className="h-5 w-5" />
                  {chapter.current ? (
                    <span className="pulse-live absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-primary-container ring-2 ring-surface" />
                  ) : null}
                </span>
                <div
                  className={`flex-1 ${
                    chapter.current
                      ? 'rounded-card border border-primary/25 bg-primary-soft/25 p-5'
                      : 'pt-1'
                  }`}
                >
                  <span className="label-bold text-on-surface-variant">{chapter.era}</span>
                  <h3 className="mt-1 font-display text-xl font-bold text-on-surface">
                    {chapter.title}
                    {chapter.current ? (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-pill bg-primary-container px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-on-primary">
                        <span className="pulse-live h-1.5 w-1.5 rounded-full bg-white" />
                        In progress
                      </span>
                    ) : null}
                  </h3>
                  <p className="mt-2 leading-relaxed text-on-surface-variant">{chapter.body}</p>
                  {chapter.image ? (
                    <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-input bg-surface-container md:max-w-md">
                      <Image
                        src={unsplashPhoto(chapter.image, 800)}
                        alt={`${chapter.title} — ${athlete.fullName}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 420px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </details>
        <div className="mt-8 flex flex-col gap-6 md:mt-16 md:grid md:grid-cols-12">
          <div className="contents md:col-span-8 md:block md:space-y-6">
            {profile.featuredVideo ? (
              <section className="card-lift order-2 rounded-card bg-surface-container-lowest p-8 md:order-none">
                <CardHeading icon="play">Featured Video</CardHeading>
                <div className="relative mt-6 aspect-video overflow-hidden rounded-input bg-surface-container">
                  <Image
                    src={unsplashPhoto(profile.featuredVideo.image, 1200)}
                    alt="Featured video thumbnail"
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-md">
                      <Icon name="play" className="h-9 w-9 text-white" />
                    </span>
                  </div>
                  <span className="absolute bottom-4 right-4 rounded-pill bg-black/60 px-3 py-1 text-xs font-bold text-white">
                    Film coming soon
                  </span>
                  <span className="absolute bottom-4 left-4 rounded bg-primary px-3 py-1 text-xs font-bold text-on-primary">
                    {profile.featuredVideo.duration}
                  </span>
                </div>
              </section>
            ) : null}
            <article
              id="story"
              className="card-lift order-1 scroll-mt-32 rounded-card bg-surface-container-lowest p-8 md:order-none"
            >
              <CardHeading icon="book">My Story</CardHeading>
              <div className="mt-4 text-lg leading-relaxed text-on-surface">
                <p className="mb-4">{profile.storyIntro}</p>
                <details className="group">
                  <summary className="label-bold inline-flex cursor-pointer list-none items-center gap-1 text-primary transition-all hover:underline group-open:hidden">
                    See more
                    <Icon name="chevron" className="h-4 w-4" />
                  </summary>
                  <div className="space-y-4">
                    {profile.storyBody.map((paragraph) => (
                      <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                    ))}
                  </div>
                </details>
              </div>
            </article>
            <div
              id="results"
              className="card-lift order-3 scroll-mt-32 rounded-card bg-surface-container-lowest p-8 md:order-none"
            >
              <CardHeading icon="timer">Personal Bests</CardHeading>
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {profile.personalBests.map((best) => (
                  <div key={best.label} className="rounded-input bg-surface-container-low p-4">
                    <p className="label-bold text-on-surface-variant">{best.label}</p>
                    <p className="font-display text-xl font-bold text-on-surface">{best.value}</p>
                  </div>
                ))}
              </div>
            </div>
            {profile.powerProfile ? (
              <div className="card-lift order-3 rounded-card bg-surface-container-lowest p-8 md:order-none">
                <CardHeading icon="insights">Power Profile</CardHeading>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-input bg-primary-soft p-4">
                    <p className="label-bold text-on-primary-container/70">FTP</p>
                    <p className="font-display text-2xl font-bold text-on-primary-container">
                      {profile.powerProfile.ftpWatts}
                    </p>
                  </div>
                  <div className="rounded-input bg-primary-soft p-4">
                    <p className="label-bold text-on-primary-container/70">Power-to-weight</p>
                    <p className="font-display text-2xl font-bold text-on-primary-container">
                      {profile.powerProfile.wattsPerKg} <span className="text-base">W/kg</span>
                    </p>
                  </div>
                  <div className="col-span-2 rounded-input bg-surface-container-low p-4">
                    <p className="label-bold text-on-surface-variant">Rider type</p>
                    <p className="font-display text-lg font-bold text-on-surface">
                      {profile.powerProfile.riderType}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Racing weight {profile.powerProfile.riderWeight}
                    </p>
                  </div>
                </div>
                <p className="eyebrow mt-6 text-on-surface-variant">Peak power</p>
                <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {profile.powerProfile.peaks.map((peak) => (
                    <div key={peak.label} className="rounded-input bg-surface-container-low p-4">
                      <p className="label-bold text-on-surface-variant">{peak.label}</p>
                      <p className="font-display text-xl font-bold text-on-surface">{peak.watts}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="card-lift order-4 rounded-card bg-surface-container-lowest p-8 md:order-none">
              <CardHeading icon="medal">{profile.highlightsHeading ?? 'Career Highlights'}</CardHeading>
              <EditedHighlights
                slug={athlete.athleteSlug}
                defaults={editDefaults}
                moreLabel={profile.moreResultsLabel}
              />
            </div>
            <section className="card-lift order-8 rounded-card bg-surface-container-lowest p-8 md:order-none">
              <CardHeading icon="history">{profile.racesHeading ?? 'Previous Races'}</CardHeading>
              <EditedRaces
                slug={athlete.athleteSlug}
                defaults={editDefaults}
                moreLabel={profile.moreRacesLabel}
              />
            </section>
            <div className="card-lift order-11 rounded-card bg-inverse-surface p-8 text-white md:order-none">
              <h3 className="mb-6 flex items-center gap-2 font-display text-xl font-bold text-primary-container">
                <Icon name="diamond" className="h-6 w-6" />
                Core Values
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {profile.coreValues.map((value) => (
                  <div key={value.title} className="rounded-input border border-white/15 p-4">
                    <p className="label-bold mb-1 text-primary-container">{value.title}</p>
                    <p className="text-xs text-white/70">{value.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="contents md:col-span-4 md:block md:space-y-6">
            <div className="card-lift order-6 space-y-4 rounded-card border border-surface-container bg-surface-container-lowest p-6 md:order-none">
              <CardHeading icon="groups">Community</CardHeading>
              <div className={`grid gap-4 ${profile.supportEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <p className="font-display text-3xl font-bold text-on-surface">
                    {profile.followers}
                  </p>
                  <p className="label-bold text-on-surface-variant">Followers</p>
                </div>
                {profile.supportEnabled ? (
                  <div>
                    <p className="font-display text-3xl font-bold text-on-surface">
                      {supportersCount}
                    </p>
                    <p className="label-bold text-on-surface-variant">Backers</p>
                  </div>
                ) : null}
              </div>
              <FollowButton slug={athlete.athleteSlug} variant="block" />
            </div>
            <div className="card-lift order-5 rounded-card border border-surface-container bg-surface-container-lowest p-6 md:order-none">
              <h3 className="mb-6 font-display text-xl font-bold text-on-surface">
                {profile.roadmapTitle}
              </h3>
              <EditedRoadmap slug={athlete.athleteSlug} defaults={editDefaults} />
            </div>
            <div
              id="training"
              className="card-lift order-7 scroll-mt-32 space-y-6 rounded-card border border-surface-container bg-surface-container-lowest p-6 md:order-none"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-on-surface">
                  Training Snapshot
                </h3>
                <span className="rounded bg-secondary-soft px-2 py-1 text-[10px] font-bold tracking-[0.05em] text-secondary">
                  THIS WEEK
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-input border-t-2 border-secondary bg-surface-container-low p-3">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.05em]">Weekly KM</p>
                  <p className="font-bold">{profile.training.weeklyKm}</p>
                </div>
                <div className="border-x border-outline-variant text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.05em]">Time</p>
                  <p className="font-bold">{profile.training.weeklyTime}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.05em]">Gain</p>
                  <p className="font-bold">{profile.training.weeklyGain}</p>
                </div>
              </div>
              {profile.training.weeklyLoad ? (
                <p className="-mt-3 text-center text-xs text-on-surface-variant">
                  <span className="font-bold text-on-surface">Load</span> ·{' '}
                  {profile.training.weeklyLoad}
                </p>
              ) : null}
              <div>
                <p className="label-bold text-on-surface">{profile.training.latestTitle}</p>
                <p className="text-xs text-on-surface-variant">{profile.training.latestMeta}</p>
              </div>
            </div>
            {profile.supportEnabled && profile.recentBackers ? (
              <div className="card-lift order-10 space-y-4 rounded-card border border-surface-container bg-surface-container-lowest p-6 md:order-none">
                <h3 className="font-display text-xl font-bold text-on-surface">Recent Backers</h3>
                <div className="space-y-4">
                  {profile.recentBackers.map((backer) => (
                    <div key={backer.name} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-sm font-bold text-on-surface-variant">
                        {backer.initials ? (
                          backer.initials
                        ) : (
                          <Icon name={backer.icon ?? 'person'} className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 truncate">
                        <p className="label-bold text-on-surface">{backer.name}</p>
                        <p className="text-xs text-on-surface-variant">{backer.when}</p>
                      </div>
                      <div className="font-bold text-secondary">
                        {formatCents(backer.amountCents)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div
              id="gallery"
              className="card-lift order-12 scroll-mt-32 space-y-4 rounded-card border border-surface-container bg-surface-container-lowest p-6 md:order-none"
            >
              <CardHeading icon="gallery">Photo Gallery</CardHeading>
              <EditedGallery slug={athlete.athleteSlug} defaults={editDefaults} />
            </div>
          </aside>
        </div>
        {profile.supportEnabled ? (
          <section
            id="back"
            className="relative mt-8 overflow-hidden rounded-card bg-inverse-surface px-6 py-12 text-center text-white md:px-16"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_center,_var(--color-primary-container)_1px,_transparent_1px)] [background-size:40px_40px]"
            />
            <div className="relative z-10 mx-auto max-w-xl">
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                {profile.backCtaBlurb ?? `Back ${firstName}’s season.`}
              </h2>
              <p className="mt-3 text-white/75">
                Donations move directly to {firstName} after a 3% platform fee — with a receipt, a
                thank-you, and a post-event recap.
              </p>
              <Link
                href="/support"
                className="mt-6 inline-flex min-h-12 items-center justify-center rounded-button bg-primary-container px-8 py-4 text-sm font-bold text-on-primary shadow-md transition-all hover:bg-primary active:scale-95"
              >
                Back this athlete
              </Link>
            </div>
          </section>
        ) : null}
        <section className="mt-6 flex flex-col items-center justify-between gap-5 rounded-card border border-outline-variant bg-surface-container-low p-6 text-center md:flex-row md:p-8 md:text-left">
          <div>
            <p className="eyebrow text-primary">{peerNoun} like {firstName} call ARC home</p>
            <h3 className="mt-1 font-display text-xl font-bold text-on-surface md:text-2xl">
              Like what you see? Build your own.
            </h3>
            <p className="mt-1 text-on-surface-variant">
              A professional home for your {sportNoun} story — free while we&rsquo;re in pilot.
            </p>
          </div>
          <Link
            href="/for-athletes"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-button bg-primary-container px-8 py-4 text-sm font-bold text-on-primary shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary active:scale-95"
          >
            Get your own ARC profile
            <ArrowGlyph className="h-4 w-4" />
          </Link>
        </section>
      </div>
      <div
        className="fixed inset-x-0 z-40 border-t border-outline-variant bg-surface-container-lowest/95 px-4 py-3 backdrop-blur md:hidden"
        style={{ bottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex max-w-[var(--spacing-container-max)] items-center gap-3">
          {profile.supportEnabled ? (
            <Link
              href="/support"
              className="flex min-h-12 flex-1 items-center justify-center rounded-button bg-primary-container px-6 text-sm font-bold text-on-primary shadow-md transition-all hover:bg-primary active:scale-95"
            >
              Back this athlete
            </Link>
          ) : (
            <button
              type="button"
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-button bg-primary-container px-6 text-sm font-bold text-on-primary shadow-md transition-all hover:bg-primary active:scale-95"
            >
              <Icon name="person-add" className="h-4 w-4" />
              Follow {firstName}
            </button>
          )}
          <ShareCard resume={shareResume} compact />
        </div>
      </div>
    </div>
  );
}

function CardHeading({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 font-display text-xl font-bold text-on-surface">
      <Icon name={icon} className="h-6 w-6 text-primary" />
      {children}
    </h3>
  );
}
