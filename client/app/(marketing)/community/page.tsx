import type { Metadata } from 'next';
import { CommunityClient } from './CommunityClient';

export const metadata: Metadata = {
  title: 'Community',
  description:
    'The runners you follow, in one live feed: race results, upcoming races, and the journey in between.',
};

export default function CommunityPage() {
  return <CommunityClient />;
}
