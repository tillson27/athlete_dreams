import type { TrendingAthlete } from '@/components/site/TrendingAthletes';
import type { IconName } from '@/components/ui/Icon';
import { unsplashPhoto } from './unsplash';

// Home page fixtures. Presentation copy + mock roster teasers live here so the
// page component stays a pure composition of sections.

export type ArcStep = {
  number: string;
  title: string;
  body: string;
  icon: IconName;
  comingSoon?: boolean;
};

export const arcSteps: ArcStep[] = [
  {
    number: '01',
    title: 'Build Your Profile',
    body: 'Your stats prove the work. Your story is why it matters — put both in your own words.',
    icon: 'person-add',
  },
  {
    number: '02',
    title: 'Set Your Goals',
    body: 'Define your upcoming competitions and what you are chasing. Make the road ahead clear.',
    icon: 'target',
  },
  {
    number: '03',
    title: 'Build Your Community',
    body: 'Share your journey with friends and backers who see exactly where their support goes via transparency.',
    icon: 'groups',
    comingSoon: true,
  },
];

export const trendingAthletes: TrendingAthlete[] = [
  {
    name: 'Cassandra de Winter',
    sport: 'Elite Endurance & Trail • Lethbridge, CAN',
    image: unsplashPhoto('1502904550040-7534597429ae', 760),
    highlight: '2:34:43 Marathon PB',
    followers: '12.4k',
    href: '/athletes/cassandra-de-winter',
  },
  {
    name: 'Jordan Blackhorse',
    sport: 'Trail & Ultra • Flagstaff, USA',
    image: unsplashPhoto('1476480862126-209bfaa8edc8', 760),
    highlight: 'Western States Golden Ticket',
    followers: '15.1k',
    href: '/athletes/jordan-blackhorse',
  },
  {
    name: 'Maya Okafor',
    sport: 'Road Marathon • Toronto, CAN',
    image: unsplashPhoto('1571008887538-b36bb32f4571', 760),
    highlight: '2:34:11 Boston Marathon',
    followers: '9.8k',
    href: '/athletes/maya-okafor',
  },
  {
    name: 'Emma Chen',
    sport: 'Road Running • Vancouver, CAN',
    image: unsplashPhoto('1540539234-c14a20fb7c7b', 760),
    highlight: 'First sub-1:50 half',
    followers: '812',
    href: '/athletes/emma-chen',
  },
];

export type LedgerLine = { label: string; amountCents: number; receipt: boolean };

export const ledgerLines: LedgerLine[] = [
  { label: 'Race entries (5 events)', amountCents: 64000, receipt: true },
  { label: 'Flights + lodging', amountCents: 185000, receipt: true },
  { label: 'Coaching block', amountCents: 240000, receipt: true },
  { label: 'Physio + nutrition', amountCents: 120000, receipt: false },
];

export const ledgerTotalCents = ledgerLines.reduce((sum, line) => sum + line.amountCents, 0);

export type SuccessStory = {
  name: string;
  sport: string;
  highlight: string;
  followers: string;
  quote: string;
  image: string;
  href: string;
};

export const successStories: SuccessStory[] = [
  {
    name: 'Félix Tremblay',
    sport: 'Para Road Racing • Canada',
    highlight: '1st Para Division, Montréal Marathon',
    followers: '6.2k',
    quote:
      'Running gave me back forward motion — literally. Every race, I carry the kids I met in the hospital with me.',
    image: unsplashPhoto('1508973379184-7517410fb0bc', 900),
    href: '/athletes/felix-tremblay',
  },
  {
    name: 'Cassandra de Winter',
    sport: 'Ultramarathon • Canada',
    highlight: 'Course record, Lost Soul Ultra 100km',
    followers: '12.4k',
    quote:
      'I’m running the 100-miler to show my kids what chasing something wholeheartedly looks like.',
    image: unsplashPhoto('1502904550040-7534597429ae', 900),
    href: '/athletes/cassandra-de-winter',
  },
];
