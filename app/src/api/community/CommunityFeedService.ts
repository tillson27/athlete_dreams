import { injectable } from 'tsyringe';
import type {
  CommunityFeedItem,
  CommunityFeedQuery,
  CommunityFeedResponse,
  FeedCategory,
} from 'fad-common';
import {
  type AthleteFeedSourceRow,
  AthleteRepository,
} from '../../repositories/AthleteRepository';
import { FollowRepository } from '../../repositories/FollowRepository';
import { UnauthorizedError } from '../../shared/errors';
import { parseEventStartDate } from '../../shared/displayDate';

type RaceResultSource = AthleteFeedSourceRow['raceResults'][number];
type AccomplishmentSource = AthleteFeedSourceRow['accomplishments'][number];
type EventSource = AthleteFeedSourceRow['events'][number];

interface TrainingSnapshot {
  latestTitle: string;
  latestMeta: string;
}

// A derived feed item paired with the value used to order it. The occurred-at
// key comes from each source's best-available date; `feedItemId` is the stable
// deterministic tiebreaker so identical input always yields identical output.
interface OrderedFeedItem {
  occurredAtMs: number;
  item: CommunityFeedItem;
}

@injectable()
export class CommunityFeedService {
  constructor(
    private readonly athleteRepository: AthleteRepository,
    private readonly followRepository: FollowRepository
  ) {}

  async listFeed(
    query: CommunityFeedQuery,
    requestingUserId?: string
  ): Promise<CommunityFeedResponse> {
    let athleteIds: string[] | undefined;
    if (query.followedOnly) {
      if (!requestingUserId) throw new UnauthorizedError('Sign in to view your followed feed');
      const follows = await this.followRepository.listForUser(requestingUserId);
      if (follows.length === 0) return { items: [], nextCursor: null };
      athleteIds = follows.map((follow) => follow.athleteId);
    }

    const sources = await this.athleteRepository.listPublishedFeedSources({
      primarySport: query.sport,
      athleteIds,
    });

    const ordered = buildOrderedFeedItems(sources).filter(
      (entry) => query.category === undefined || entry.item.category === query.category
    );
    sortFeedItems(ordered);

    const offset = decodeOffsetCursor(query.cursor);
    const page = ordered.slice(offset, offset + query.limit);
    const hasMore = offset + query.limit < ordered.length;
    const nextCursor = hasMore ? encodeOffsetCursor(offset + query.limit) : null;

    return { items: page.map((entry) => entry.item), nextCursor };
  }
}

// Derives every feed item for the supplied athletes. Pure and unit-testable:
// milestone = first highlight, race = latest race result, roadmap = next event,
// training = the presentation snapshot — mirroring `client/lib/communityFeed.ts`.
export function buildOrderedFeedItems(sources: AthleteFeedSourceRow[]): OrderedFeedItem[] {
  const ordered: OrderedFeedItem[] = [];
  for (const source of sources) {
    const milestone = toMilestoneItem(source);
    if (milestone) ordered.push(milestone);
    const race = toRaceItem(source);
    if (race) ordered.push(race);
    const roadmap = toRoadmapItem(source);
    if (roadmap) ordered.push(roadmap);
    const training = toTrainingItem(source);
    if (training) ordered.push(training);
  }
  return ordered;
}

// Deterministic ordering: newest source date first, then `feedItemId` ascending
// so SSR and client renders never diverge and pagination windows are stable.
export function sortFeedItems(items: OrderedFeedItem[]): void {
  items.sort((left, right) => {
    if (left.occurredAtMs !== right.occurredAtMs) return right.occurredAtMs - left.occurredAtMs;
    return left.item.feedItemId < right.item.feedItemId ? -1 : 1;
  });
}

function toMilestoneItem(source: AthleteFeedSourceRow): OrderedFeedItem | null {
  const highlight: AccomplishmentSource | undefined = source.accomplishments[0];
  if (!highlight) return null;
  const occurredAtMs = highlight.occurredOn?.getTime() ?? highlight.createdAt.getTime();
  return {
    occurredAtMs,
    item: {
      ...baseItem(source, 'milestone', 'result', highlight.id),
      headline: `Hit a milestone — ${highlight.title}`,
      detail: highlight.detail ?? highlight.title,
      photoUrl: toPhotoUrl(highlight.photoRefs),
      occurredAtLabel: 'Recent milestone',
      isVerified: hasResultUrl(highlight.resultUrl),
    },
  };
}

function toRaceItem(source: AthleteFeedSourceRow): OrderedFeedItem | null {
  const race: RaceResultSource | undefined = source.raceResults[0];
  if (!race) return null;
  const occurredAtMs = (race.occurredOn ?? parseEventStartDate(race.displayDate)).getTime();
  return {
    occurredAtMs,
    item: {
      ...baseItem(source, 'race', 'result', race.id),
      headline: `Raced ${race.resultName}`,
      detail: race.resultSummary,
      photoUrl: toPhotoUrl(race.photoRefs),
      occurredAtLabel: race.displayDate,
      isVerified: hasResultUrl(race.resultUrl),
    },
  };
}

function toRoadmapItem(source: AthleteFeedSourceRow): OrderedFeedItem | null {
  const event: EventSource | undefined = source.events[0];
  if (!event) return null;
  const displayDate = event.displayDate ?? event.eventName;
  return {
    occurredAtMs: event.eventStartDate.getTime(),
    item: {
      ...baseItem(source, 'race', 'roadmap', event.id),
      headline: `Is racing ${event.eventName}`,
      detail: `Up next · ${displayDate}`,
      photoUrl: null,
      occurredAtLabel: displayDate,
      isVerified: false,
    },
  };
}

// Training has no persisted row, so its stable source id is the literal
// `training`; it carries no real date and always sorts last (sentinel 0),
// matching the client feed where training is the trailing block.
function toTrainingItem(source: AthleteFeedSourceRow): OrderedFeedItem | null {
  const training = toTrainingSnapshot(source.presentation);
  if (!training) return null;
  return {
    occurredAtMs: 0,
    item: {
      ...baseItem(source, 'training', 'roadmap', 'training'),
      headline: `Logged a training run — ${training.latestTitle}`,
      detail: training.latestMeta,
      photoUrl: null,
      occurredAtLabel: 'Latest session',
      isVerified: false,
    },
  };
}

function baseItem(
  source: AthleteFeedSourceRow,
  category: FeedCategory,
  kind: CommunityFeedItem['kind'],
  sourceId: string
): Pick<
  CommunityFeedItem,
  'feedItemId' | 'athleteSlug' | 'athleteName' | 'primarySport' | 'kind' | 'category'
> {
  return {
    feedItemId: `${source.athleteSlug}-${category}-${sourceId}`,
    athleteSlug: source.athleteSlug,
    athleteName: source.fullName,
    primarySport: source.primarySport,
    kind,
    category,
  };
}

function hasResultUrl(resultUrl: string | null): boolean {
  return typeof resultUrl === 'string' && resultUrl.trim().length > 0;
}

// The seed stores bare Unsplash asset refs (e.g. `1594882645126-14020914d58d`),
// not URLs, while the contract's `photoUrl` demands `.url()`; emit a value only
// when the ref is already an absolute http(s) URL, otherwise null (see step 11
// notes / the step-12 ref-vs-url decision — contract and seed are unchanged).
function toPhotoUrl(photoRefs: string[]): string | null {
  const ref = photoRefs[0];
  if (!ref) return null;
  try {
    const parsed = new URL(ref);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? ref : null;
  } catch {
    return null;
  }
}

function toTrainingSnapshot(presentation: unknown): TrainingSnapshot | null {
  if (typeof presentation !== 'object' || presentation === null || Array.isArray(presentation)) {
    return null;
  }
  const training = (presentation as { training?: unknown }).training;
  if (typeof training !== 'object' || training === null) return null;
  const { latestTitle, latestMeta } = training as { latestTitle?: unknown; latestMeta?: unknown };
  if (typeof latestTitle !== 'string' || latestTitle.length === 0) return null;
  if (typeof latestMeta !== 'string') return null;
  return { latestTitle, latestMeta };
}

const CURSOR_SEPARATOR = 'offset:';

function encodeOffsetCursor(offset: number): string {
  return Buffer.from(`${CURSOR_SEPARATOR}${offset}`, 'utf8').toString('base64url');
}

// Derived feeds treat the cursor as a simple offset window over the
// deterministic ordering. Garbage or out-of-range cursors decode to 0/empty
// rather than throwing, matching the context §11 out-of-range behavior.
function decodeOffsetCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const raw = Buffer.from(cursor, 'base64url').toString('utf8');
  if (!raw.startsWith(CURSOR_SEPARATOR)) return 0;
  const parsed = Number.parseInt(raw.slice(CURSOR_SEPARATOR.length), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}
