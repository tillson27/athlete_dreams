import type {
  AthleteDirectoryItem,
  AthleteProfile,
  CampaignSummary,
  CommunityFeedItem,
} from 'fad-common';
import type { MockAthlete } from './mockAthletes';
import type {
  ArcChapter,
  ExtraHighlight,
  ExtraRace,
  HighlightEntry,
  PowerProfile,
  RaceEntry,
  RecentBacker,
  RichAthleteProfile,
} from './athleteProfiles';
import type { FeedItem, RacingSoon } from './communityFeed';
import { formatSport } from './format';
import { unsplashPhoto } from './unsplash';

// Pure adapters mapping `fad-common` API DTOs into the client's existing
// view-model shapes (`MockAthlete`, `RichAthleteProfile`, `FeedItem`,
// `RacingSoon`), so pages/components consume one interface regardless of the
// active data source. Presentation-only view fields (arc chapters, training,
// tones, headings) round-trip through the profile's untyped `presentation`
// blob, which the seed writes and the API returns verbatim; every read is
// defensive because `presentation` is `z.record(z.unknown())`.

const RUNNER_SPORTS: ReadonlyArray<MockAthlete['primarySport']> = ['RUNNING', 'TRACK_AND_FIELD'];

export function isRunnerSport(sport: string): boolean {
  return (RUNNER_SPORTS as readonly string[]).includes(sport);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

// Profile loads can still receive a server-rendered fallback hero while API data
// is in flight; once the API returns, prefer its persisted cover.
export function directoryItemToMockAthlete(item: AthleteDirectoryItem): MockAthlete {
  return {
    athleteSlug: item.athleteSlug,
    fullName: item.fullName,
    headline: item.headline ?? '',
    bio: '',
    primarySport: item.primarySport as MockAthlete['primarySport'],
    runnerLevel: (item.runnerLevel ?? 'EVERYDAY') as MockAthlete['runnerLevel'],
    hometown: item.hometown ?? '',
    countryCode: (item.countryCode ?? 'CA') as MockAthlete['countryCode'],
    heroMediaUrl: item.heroMediaUrl ?? '',
    values: [],
    activeCampaignCount: item.activeCampaignCount,
    totalRaisedCents: item.totalRaisedCents,
    campaigns: [],
    accomplishments: [],
  };
}

export function profileToMockAthlete(
  profile: AthleteProfile,
  heroMediaUrlFallback: string,
  campaigns: CampaignSummary[] = []
): MockAthlete {
  const mappedCampaigns = campaigns.map(campaignSummaryToMockCampaign);
  return {
    athleteSlug: profile.athleteSlug,
    fullName: profile.fullName,
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    primarySport: profile.primarySport as MockAthlete['primarySport'],
    runnerLevel: (profile.runnerLevel ?? 'EVERYDAY') as MockAthlete['runnerLevel'],
    hometown: profile.hometown ?? '',
    countryCode: (profile.countryCode ?? 'CA') as MockAthlete['countryCode'],
    heroMediaUrl:
      profile.heroMediaUrl ??
      (heroMediaUrlFallback || (profile.gallery?.[0] ? unsplashPhoto(profile.gallery[0], 1400) : '')),
    values: profile.values,
    activeCampaignCount: campaigns.filter((campaign) => campaign.campaignStatus === 'ACTIVE').length,
    totalRaisedCents: campaigns.reduce((sum, campaign) => sum + campaign.raisedAmountCents, 0),
    campaigns: mappedCampaigns,
    accomplishments: [],
  };
}

// The campaign summary carries no story/cost-lines (those live on the full
// campaign detail); the donate flow only needs the id, status, and totals.
function campaignSummaryToMockCampaign(campaign: CampaignSummary): MockAthlete['campaigns'][number] {
  return {
    campaignId: campaign.campaignId,
    campaignStatus: campaign.campaignStatus,
    campaignSlug: campaign.campaignSlug,
    campaignTitle: campaign.campaignTitle,
    campaignType: campaign.campaignType as MockAthlete['campaigns'][number]['campaignType'],
    campaignStory: '',
    targetAmountCents: campaign.targetAmountCents,
    raisedAmountCents: campaign.raisedAmountCents,
    supporterCount: campaign.supporterCount,
    closesAt: campaign.closesAt,
    costLines: [],
  };
}

function toHighlightEntries(
  accomplishments: AthleteProfile['accomplishments'],
  presentation: Record<string, unknown>
): { careerHighlights: HighlightEntry[]; moreResults: ExtraHighlight[] } {
  const toneByTitle = new Map<string, HighlightEntry['tone']>();
  const orderByTitle = new Map<string, number>();
  const highlightTones = Array.isArray(presentation.highlightTones) ? presentation.highlightTones : [];
  highlightTones.forEach((entry, index) => {
    const record = asRecord(entry);
    const title = asString(record.title);
    if (title) {
      toneByTitle.set(title, record.tone === 'secondary' ? 'secondary' : 'primary');
      orderByTitle.set(title, index);
    }
  });

  const careerHighlights: HighlightEntry[] = [];
  const moreResults: ExtraHighlight[] = [];
  for (const accomplishment of accomplishments) {
    if (toneByTitle.has(accomplishment.title)) {
      careerHighlights.push({
        title: accomplishment.title,
        detail: accomplishment.detail ?? accomplishment.description ?? '',
        tone: toneByTitle.get(accomplishment.title) ?? 'primary',
        images: accomplishment.photoRefs,
      });
    } else {
      moreResults.push({
        title: accomplishment.title,
        detail: accomplishment.detail ?? accomplishment.description ?? '',
        images: accomplishment.photoRefs,
      });
    }
  }
  careerHighlights.sort(
    (a, b) => (orderByTitle.get(a.title) ?? 0) - (orderByTitle.get(b.title) ?? 0)
  );
  return { careerHighlights, moreResults };
}

function toRaceEntries(
  raceResults: NonNullable<AthleteProfile['raceResults']>,
  presentation: Record<string, unknown>
): { previousRaces: RaceEntry[]; morePreviousRaces: ExtraRace[] } {
  const toneByName = new Map<string, RaceEntry['tone']>();
  const orderByName = new Map<string, number>();
  const raceTones = Array.isArray(presentation.raceTones) ? presentation.raceTones : [];
  raceTones.forEach((entry, index) => {
    const record = asRecord(entry);
    const name = asString(record.name);
    if (name) {
      toneByName.set(name, record.tone === 'secondary' ? 'secondary' : 'primary');
      orderByName.set(name, index);
    }
  });

  const previousRaces: RaceEntry[] = [];
  const morePreviousRaces: ExtraRace[] = [];
  for (const race of raceResults) {
    if (toneByName.has(race.resultName)) {
      previousRaces.push({
        name: race.resultName,
        date: race.displayDate,
        result: race.resultSummary,
        tone: toneByName.get(race.resultName) ?? 'primary',
        links: race.links.length > 0 ? race.links : undefined,
        images: race.photoRefs,
      });
    } else {
      morePreviousRaces.push({
        name: race.resultName,
        date: race.displayDate,
        result: race.resultSummary,
        images: race.photoRefs,
      });
    }
  }
  previousRaces.sort((a, b) => (orderByName.get(a.name) ?? 0) - (orderByName.get(b.name) ?? 0));
  return { previousRaces, morePreviousRaces };
}

function toArcChapters(value: unknown): ArcChapter[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const record = asRecord(entry);
    return {
      era: asString(record.era),
      title: asString(record.title),
      icon: asString(record.icon, 'medal') as ArcChapter['icon'],
      tone: asString(record.tone, 'primary') as ArcChapter['tone'],
      body: asString(record.body),
      image: asOptionalString(record.image),
      current: record.current === true ? true : undefined,
    };
  });
}

function toTraining(value: unknown): RichAthleteProfile['training'] {
  const record = asRecord(value);
  return {
    weeklyKm: asString(record.weeklyKm),
    weeklyTime: asString(record.weeklyTime),
    weeklyGain: asString(record.weeklyGain),
    weeklyLoad: asOptionalString(record.weeklyLoad),
    latestTitle: asString(record.latestTitle),
    latestMeta: asString(record.latestMeta),
  };
}

function toPowerProfile(value: unknown): PowerProfile | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  return {
    ftpWatts: asString(record.ftpWatts),
    wattsPerKg: asString(record.wattsPerKg),
    riderWeight: asString(record.riderWeight),
    riderType: asString(record.riderType),
    peaks: Array.isArray(record.peaks)
      ? record.peaks.map((peak) => {
          const peakRecord = asRecord(peak);
          return { label: asString(peakRecord.label), watts: asString(peakRecord.watts) };
        })
      : [],
  };
}

function toRecentBackers(value: unknown): RecentBacker[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((entry) => {
    const record = asRecord(entry);
    return {
      name: asString(record.name),
      when: asString(record.when),
      amountCents: typeof record.amountCents === 'number' ? record.amountCents : 0,
      initials: asOptionalString(record.initials),
      icon: record.icon === 'groups' || record.icon === 'person' ? record.icon : undefined,
    };
  });
}

function toInstagramPosts(value: unknown): RichAthleteProfile['instagramPosts'] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const record = asRecord(entry);
    return { id: asString(record.id), likes: asString(record.likes) };
  });
}

function toFeaturedVideo(value: unknown): RichAthleteProfile['featuredVideo'] {
  if (value === null || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  return { image: asString(record.image), duration: asString(record.duration) };
}

export function profileToRichProfile(profile: AthleteProfile): RichAthleteProfile {
  const presentation = asRecord(profile.presentation);
  const { careerHighlights, moreResults } = toHighlightEntries(profile.accomplishments, presentation);
  const { previousRaces, morePreviousRaces } = toRaceEntries(profile.raceResults ?? [], presentation);
  const rawHandle = profile.handle ?? '';

  return {
    athleteSlug: profile.athleteSlug,
    handle: rawHandle ? `@${rawHandle}` : '',
    followers: asString(presentation.followersLabel),
    disciplineLabel: profile.disciplineLabel ?? formatSport(profile.primarySport),
    arcSubtitle: asString(presentation.arcSubtitle),
    storyIntro: profile.storyIntro ?? '',
    storyBody: profile.storyBody ?? [],
    personalBests: (profile.personalBests ?? []).map((best) => ({
      label: best.label,
      value: best.value,
    })),
    careerHighlights,
    highlightsHeading: asOptionalString(presentation.highlightsHeading),
    moreResults,
    moreResultsLabel: asString(presentation.moreResultsLabel, 'See more results'),
    previousRaces,
    racesHeading: asOptionalString(presentation.racesHeading),
    morePreviousRaces,
    moreRacesLabel: asString(presentation.moreRacesLabel, 'See more races'),
    roadmapTitle: asString(presentation.roadmapTitle, 'Roadmap'),
    roadmap: (profile.roadmap ?? []).map((event) => ({
      name: event.eventName,
      date: event.displayDate,
    })),
    coreValues: profile.coreValues ?? [],
    arcChapters: toArcChapters(presentation.arcChapters),
    instagramPosts: toInstagramPosts(presentation.instagramPosts),
    training: toTraining(presentation.training),
    powerProfile: toPowerProfile(presentation.powerProfile),
    galleryPhotos: profile.gallery ?? [],
    featuredVideo: toFeaturedVideo(presentation.featuredVideo),
    supportEnabled: asBoolean(presentation.supportEnabled),
    backCtaBlurb: asOptionalString(presentation.backCtaBlurb),
    recentBackers: toRecentBackers(presentation.recentBackers),
    supporterCount:
      typeof presentation.supporterCount === 'number' ? presentation.supporterCount : undefined,
  };
}

const RESULT_WHENS = ['just now', '2h ago', '4h ago', '7h ago', '11h ago', 'yesterday'];

// Maps an API feed item to the client feed card. `avatar` comes from a per-slug
// hero map the loader assembles from the directory, because the feed contract
// carries no hero image; `discipline` falls back to the formatted sport since the
// contract carries no discipline label. `cheers` is a stable index-derived count
// (mock parity; cheers are not persisted — deferred per `docs/backend-build-sheet.md`).
export function feedItemToView(
  item: CommunityFeedItem,
  index: number,
  avatarBySlug: ReadonlyMap<string, string>
): FeedItem {
  return {
    id: item.feedItemId,
    athleteSlug: item.athleteSlug,
    athleteName: item.athleteName,
    avatar: avatarBySlug.get(item.athleteSlug) ?? '',
    discipline: formatSport(item.primarySport),
    primarySport: item.primarySport as MockAthlete['primarySport'],
    kind: item.kind,
    category: item.category,
    headline: item.headline,
    detail: item.detail,
    photo: item.photoUrl ? unsplashPhoto(item.photoUrl, 640) : undefined,
    when: item.occurredAtLabel || RESULT_WHENS[index % RESULT_WHENS.length],
    occurredAt: item.occurredAt,
    cheers: Math.max(7, 72 - index * 5),
    verified: item.isVerified,
  };
}

export function feedItemToRacingSoon(
  item: CommunityFeedItem,
  avatarBySlug: ReadonlyMap<string, string>
): RacingSoon {
  const event = item.headline.replace(/^Is racing\s+/i, '');
  const date = item.detail.replace(/^Up next\s*·\s*/i, '');
  return {
    athleteSlug: item.athleteSlug,
    athleteName: item.athleteName,
    avatar: avatarBySlug.get(item.athleteSlug) ?? '',
    event,
    date,
  };
}
