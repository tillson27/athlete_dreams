import { mockAthletes, type MockAthlete } from './mockAthletes';
import { athleteProfiles } from './athleteProfiles';
import { unsplashPhoto } from './unsplash';

// Builds the community feed from real roster data — verified results and
// upcoming races — rather than fabricated posts. Deterministic so SSR and the
// client render identically (no hydration mismatch, no Math.random).

export type FeedKind = 'result' | 'roadmap';
export type FeedCategory = 'race' | 'training' | 'milestone';

export type FeedItem = {
  id: string;
  athleteSlug: string;
  athleteName: string;
  avatar: string;
  discipline: string;
  primarySport: MockAthlete['primarySport'];
  kind: FeedKind;
  category: FeedCategory;
  headline: string;
  detail: string;
  photo?: string;
  when: string;
  cheers: number;
  verified: boolean;
};

export type RacingSoon = {
  athleteSlug: string;
  athleteName: string;
  avatar: string;
  event: string;
  date: string;
};

const RESULT_WHENS = ['just now', '2h ago', '4h ago', '7h ago', '11h ago', 'yesterday'];
const ROADMAP_WHENS = ['yesterday', '2 days ago', '2 days ago', '3 days ago', '4 days ago', '6 days ago'];

export function buildFeed(): FeedItem[] {
  const milestones: FeedItem[] = [];
  const races: FeedItem[] = [];
  const training: FeedItem[] = [];

  mockAthletes.forEach((athlete, index) => {
    const profile = athleteProfiles[athlete.athleteSlug];
    if (!profile) return;
    const base = {
      athleteSlug: athlete.athleteSlug,
      athleteName: athlete.fullName,
      avatar: unsplashPhoto(athlete.heroMediaUrl, 200),
      discipline: profile.disciplineLabel,
      primarySport: athlete.primarySport,
    };

    // Milestone — a signature career achievement.
    const highlight = profile.careerHighlights[0];
    if (highlight) {
      milestones.push({
        ...base,
        id: `${athlete.athleteSlug}-milestone`,
        kind: 'result',
        category: 'milestone',
        headline: `Hit a milestone — ${highlight.title}`,
        detail: highlight.detail,
        photo: highlight.images[0] ? unsplashPhoto(highlight.images[0], 640) : undefined,
        when: RESULT_WHENS[index % RESULT_WHENS.length],
        cheers: Math.max(9, 84 - index * 9),
        verified: true,
      });
    }

    // Race — most recent verified race result.
    const lastRace = profile.previousRaces[0];
    if (lastRace) {
      races.push({
        ...base,
        id: `${athlete.athleteSlug}-race`,
        kind: 'result',
        category: 'race',
        headline: `Raced ${lastRace.name}`,
        detail: lastRace.result,
        photo: lastRace.images[0] ? unsplashPhoto(lastRace.images[0], 640) : undefined,
        when: RESULT_WHENS[(index + 2) % RESULT_WHENS.length],
        cheers: Math.max(7, 72 - index * 7),
        verified: true,
      });
    }

    // Race — what's next on the roadmap.
    const nextRace = profile.roadmap[0];
    if (nextRace) {
      races.push({
        ...base,
        id: `${athlete.athleteSlug}-roadmap`,
        kind: 'roadmap',
        category: 'race',
        headline: `Is racing ${nextRace.name}`,
        detail: `Up next · ${nextRace.date}`,
        when: ROADMAP_WHENS[index % ROADMAP_WHENS.length],
        cheers: Math.max(4, 41 - index * 4),
        verified: false,
      });
    }

    // Training run — the latest logged session.
    const latestSession = profile.training;
    if (latestSession?.latestTitle) {
      training.push({
        ...base,
        id: `${athlete.athleteSlug}-training`,
        kind: 'roadmap',
        category: 'training',
        headline: `Logged a training run — ${latestSession.latestTitle}`,
        detail: latestSession.latestMeta,
        when: ROADMAP_WHENS[(index + 1) % ROADMAP_WHENS.length],
        cheers: Math.max(3, 33 - index * 3),
        verified: false,
      });
    }
  });

  return [...milestones, ...races, ...training];
}

export function buildRacingSoon(): RacingSoon[] {
  return mockAthletes
    .map((athlete) => {
      const profile = athleteProfiles[athlete.athleteSlug];
      const nextRace = profile?.roadmap[0];
      if (!nextRace) return null;
      return {
        athleteSlug: athlete.athleteSlug,
        athleteName: athlete.fullName,
        avatar: unsplashPhoto(athlete.heroMediaUrl, 160),
        event: nextRace.name,
        date: nextRace.date,
      };
    })
    .filter((entry): entry is RacingSoon => entry !== null);
}
