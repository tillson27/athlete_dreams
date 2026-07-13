import type { Metadata } from 'next';
import { listCommunityFeed } from '@/lib/api/community';
import { CommunityClient } from './CommunityClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Community',
  description:
    'The runners you follow, in one live feed — verified results, upcoming races, and the journey in between.',
};

export default async function CommunityPage() {
  const [feed, racingSoonFeed] = await Promise.all([
    listCommunityFeed({ scope: 'EVERYONE', limit: 50 }).catch(() => ({ items: [], nextCursor: null })),
    listCommunityFeed({ scope: 'EVERYONE', category: 'ROADMAP', limit: 12 }).catch(() => ({
      items: [],
      nextCursor: null,
    })),
  ]);

  return <CommunityClient initialFeed={feed.items} initialRacingSoon={racingSoonFeed.items} />;
}
