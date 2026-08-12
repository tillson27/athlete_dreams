import type { MockAthlete } from './mockAthletes';
import type { RichAthleteProfile } from './athleteProfiles';
import type { ProfileView } from './dataSourceTypes';
import { createBrowserStore } from './browserStore';
import { nameFromSlug, slugifyName } from './slugify';
import { unsplashPhoto } from './unsplash';
import type { OnboardingProfile } from '@/app/register/_components/onboardingProfile';

const onboardingStore = createBrowserStore<Partial<OnboardingProfile>>(
  'arc-onboarding-profile',
  'arc-onboarding-profile-change'
);
const sessionStore = createBrowserStore<{ name?: string; published?: boolean }>(
  'arc-session',
  'arc-session-change'
);

const DEFAULT_COVER = unsplashPhoto('1571008887538-b36bb32f4571', 1400);

// The wizard no longer asks athletes to pick a running category, so every
// preview reads back the one launch discipline.
const DEFAULT_DISCIPLINE_LABEL = 'Running';

export function loadOnboardingProfileView(
  athleteSlug: string,
  coverPhoto?: string
): ProfileView | null {
  const stored = onboardingStore.read();
  if (!stored?.name || slugifyName(stored.name) !== athleteSlug) {
    return null;
  }
  return onboardingProfileToProfileView(stored, athleteSlug, coverPhoto);
}

export function subscribeToOnboardingProfile(listener: () => void): () => void {
  return onboardingStore.subscribe(listener);
}

export function loadPublishedOnboardingAthlete(coverPhoto?: string): MockAthlete | null {
  const session = sessionStore.read();
  if (!session?.published) return null;
  const stored = onboardingStore.read();
  const name = stored?.name ?? session.name ?? '';
  const athleteSlug = slugifyName(name);
  if (!athleteSlug) return null;
  return onboardingProfileToProfileView(stored ?? { name }, athleteSlug, coverPhoto).athlete;
}

export function subscribeToPublishedOnboardingAthlete(listener: () => void): () => void {
  const unsubscribeOnboarding = onboardingStore.subscribe(listener);
  const unsubscribeSession = sessionStore.subscribe(listener);
  return () => {
    unsubscribeOnboarding();
    unsubscribeSession();
  };
}

function onboardingProfileToProfileView(
  profile: Partial<OnboardingProfile>,
  athleteSlug: string,
  coverPhoto?: string
): ProfileView {
  const fullName = profile.name?.trim() || nameFromSlug(athleteSlug);
  const hometown = profile.location?.trim() || '';
  const storyBody = paragraphsFromBio(profile.bio ?? '');
  const storyIntro = profile.mission?.trim() ?? '';

  const athlete: MockAthlete = {
    athleteSlug,
    fullName,
    headline: storyIntro || DEFAULT_DISCIPLINE_LABEL,
    bio: storyBody.join('\n\n'),
    primarySport: 'RUNNING',
    runnerLevel: 'EVERYDAY',
    hometown,
    countryCode: 'CA',
    heroMediaUrl: coverPhoto ?? DEFAULT_COVER,
    values: profile.values ?? [],
    activeCampaignCount: 0,
    totalRaisedCents: 0,
    campaigns: [],
    accomplishments: [],
  };

  const richProfile: RichAthleteProfile = {
    athleteSlug,
    handle: '',
    followers: '',
    disciplineLabel: DEFAULT_DISCIPLINE_LABEL,
    arcSubtitle: '',
    storyIntro,
    storyBody,
    personalBests: (profile.personalBests ?? [])
      .filter((best) => best.distance.trim() && best.time.trim())
      .map((best) => ({ label: best.distance.trim(), value: best.time.trim() })),
    careerHighlights: (profile.careerHighlights ?? [])
      .filter((highlight) => highlight.title.trim())
      .map((highlight, index) => ({
        title: highlight.title.trim(),
        detail: highlight.detail.trim(),
        tone: index % 2 === 0 ? 'secondary' : 'primary',
        images: [],
      })),
    moreResults: [],
    moreResultsLabel: 'See more results',
    previousRaces: (profile.previousRaces ?? [])
      .filter((race) => race.name.trim())
      .map((race, index) => ({
        name: race.name.trim(),
        date: 'Date TBD',
        result: race.result.trim(),
        tone: index % 2 === 0 ? 'secondary' : 'primary',
        images: [],
      })),
    morePreviousRaces: [],
    moreRacesLabel: 'See more races',
    roadmapTitle: 'Roadmap',
    roadmap: [],
    coreValues: (profile.values ?? []).map((value) => ({ title: value, body: '' })),
    arcChapters: [],
    instagramPosts: [],
    training: {
      weeklyKm: '',
      weeklyTime: '',
      weeklyGain: '',
      latestTitle: '',
      latestMeta: '',
    },
    galleryPhotos: [],
    supportEnabled: false,
  };

  return { athlete, profile: richProfile };
}

function paragraphsFromBio(bio: string): string[] {
  return bio
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}
