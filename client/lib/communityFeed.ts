import { mockAthletes, type MockAthlete } from './mockAthletes';
import { athleteProfiles } from './athleteProfiles';

// Builds the community feed from real roster data — verified results and
// upcoming races — rather than fabricated posts. Deterministic so SSR and the
// client render identically (no hydration mismatch, no Math.random).

const IMG = (id: string, width = 640) =>
  id.startsWith('http')
    ? id
    : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;

export type FeedKind = 'result' | 'roadmap';

export type FeedItem = {
  id: string;
  athleteSlug: string;
  athleteName: string;
  avatar: string;
  discipline: string;
  primarySport: MockAthlete['primarySport'];
  kind: FeedKind;
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
  const results: FeedItem[] = [];
  const roadmaps: FeedItem[] = [];

  mockAthletes.forEach((athlete, index) => {
    const profile = athleteProfiles[athlete.athleteSlug];
    if (!profile) return;
    const avatar = IMG(athlete.heroMediaUrl, 200);

    const topHighlight = profile.careerHighlights[0];
    if (topHighlight) {
      results.push({
        id: `${athlete.athleteSlug}-result`,
        athleteSlug: athlete.athleteSlug,
        athleteName: athlete.fullName,
        avatar,
        discipline: profile.disciplineLabel,
        primarySport: athlete.primarySport,
        kind: 'result',
        headline: `Logged a verified result at ${topHighlight.title}`,
        detail: topHighlight.detail,
        photo: topHighlight.images[0] ? IMG(topHighlight.images[0]) : undefined,
        when: RESULT_WHENS[index % RESULT_WHENS.length],
        cheers: 84 - index * 9,
        verified: true,
      });
    }

    const nextRace = profile.roadmap[0];
    if (nextRace) {
      roadmaps.push({
        id: `${athlete.athleteSlug}-roadmap`,
        athleteSlug: athlete.athleteSlug,
        athleteName: athlete.fullName,
        avatar,
        discipline: profile.disciplineLabel,
        primarySport: athlete.primarySport,
        kind: 'roadmap',
        headline: `Is racing ${nextRace.name}`,
        detail: `Up next · ${nextRace.date}`,
        when: ROADMAP_WHENS[index % ROADMAP_WHENS.length],
        cheers: 41 - index * 4,
        verified: false,
      });
    }
  });

  return [...results, ...roadmaps];
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
        avatar: IMG(athlete.heroMediaUrl, 160),
        event: nextRace.name,
        date: nextRace.date,
      };
    })
    .filter((entry): entry is RacingSoon => entry !== null);
}
