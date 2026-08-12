// Placeholder data used while the API is being wired up. The shapes mirror
// what `fad-common`'s `athleteDirectoryItemSchema` will return.
// Launch roster is runners-only; rich profile content lives in athleteProfiles.ts.

export type MockAthlete = {
  athleteSlug: string;
  fullName: string;
  headline: string;
  bio: string;
  primarySport: 'RUNNING' | 'TRACK_AND_FIELD' | 'ROAD_CYCLING';
  runnerLevel: 'ELITE' | 'COMPETITIVE' | 'EVERYDAY';
  hometown: string;
  countryCode: 'CA' | 'US';
  heroMediaUrl: string;
  values: string[];
  activeCampaignCount: number;
  totalRaisedCents: number;
  campaigns: {
    // API-mode only: the UUID + status are needed to open the donation flow
    // (createDonation targets campaignId; the widget gates on ACTIVE). Mock
    // entries omit them — the donate widget is api-mode only.
    campaignId?: string;
    campaignStatus?: 'DRAFT' | 'ACTIVE' | 'FUNDED' | 'COMPLETED' | 'ARCHIVED';
    campaignSlug: string;
    campaignTitle: string;
    campaignType: 'EVENT' | 'GEAR' | 'TRAVEL' | 'TRAINING' | 'SEASON';
    campaignStory: string;
    targetAmountCents: number;
    raisedAmountCents: number;
    supporterCount: number;
    closesAt: string | null;
    costLines: { label: string; amountCents: number }[];
  }[];
  accomplishments: { title: string; year: number }[];
};

export const mockAthletes: MockAthlete[] = [
  {
    athleteSlug: 'maya-okafor',
    fullName: 'Maya Okafor',
    headline: 'Marathoner chasing a sub-2:30 in Tokyo',
    bio: 'I started running to stay sane during med school. Five years later, I am one race away from a podium finish in a World Marathon Major. I run to show kids in my Lagos neighbourhood that bodies move and minds heal.',
    primarySport: 'RUNNING',
    runnerLevel: 'ELITE',
    hometown: 'Toronto, ON',
    countryCode: 'CA',
    heroMediaUrl:
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=1400&q=70',
    values: ['Mental health', 'First-gen athlete', 'Mentorship'],
    activeCampaignCount: 1,
    totalRaisedCents: 1840000,
    campaigns: [
      {
        campaignSlug: 'tokyo-marathon-2026',
        campaignTitle: 'Get me to Tokyo Marathon 2026',
        campaignType: 'EVENT',
        campaignStory:
          'I qualified — barely — at Boston this spring. Tokyo is the last Major I need to complete the set, and the field is brutal. Every dollar gets me one block closer to the start line.',
        targetAmountCents: 4200000,
        raisedAmountCents: 1840000,
        supporterCount: 48,
        closesAt: '2026-02-15T23:59:59Z',
        costLines: [
          { label: 'Race entry + qualifier travel', amountCents: 900000 },
          { label: 'Flights (YYZ ↔ HND)', amountCents: 1800000 },
          { label: '12 nights accommodation', amountCents: 1100000 },
          { label: 'Coach + altitude camp', amountCents: 400000 },
        ],
      },
    ],
    accomplishments: [
      { title: '2:34:11 — Boston Marathon', year: 2025 },
      { title: '1:11:58 — Houston Half Marathon', year: 2026 },
      { title: 'Canadian 10K silver', year: 2024 },
      { title: 'NCAA Cross-Country All-American', year: 2022 },
    ],
  },
  {
    athleteSlug: 'felix-tremblay',
    fullName: 'Félix Tremblay',
    headline: 'Para road racer chasing the Boston Marathon para division',
    bio: 'I lost my left leg in a snowmobile accident at 17. Six years later, I race marathons on a running blade — a 3:04 in Montréal and a para 5000m national title so far. I run for every kid sitting in a hospital wondering what is next.',
    primarySport: 'RUNNING',
    runnerLevel: 'COMPETITIVE',
    hometown: 'Saguenay, QC',
    countryCode: 'CA',
    heroMediaUrl:
      'https://images.unsplash.com/photo-1508973379184-7517410fb0bc?auto=format&fit=crop&w=1400&q=70',
    values: ['Adaptive sport', 'Resilience', 'Bilingual outreach'],
    activeCampaignCount: 2,
    totalRaisedCents: 2475000,
    campaigns: [
      {
        campaignSlug: 'boston-para-2026',
        campaignTitle: 'Boston Marathon — Para Division 2026',
        campaignType: 'EVENT',
        campaignStory:
          'Boston has a para division and I have the qualifying time. Getting an athlete, a guide, and a spare running blade from Saguenay to Boylston Street is the expensive part.',
        targetAmountCents: 3600000,
        raisedAmountCents: 2100000,
        supporterCount: 67,
        closesAt: '2026-03-15T23:59:59Z',
        costLines: [
          { label: 'Flights + travel for athlete and guide', amountCents: 1400000 },
          { label: 'Race-week accommodation', amountCents: 1100000 },
          { label: 'Prosthetist support + blade servicing', amountCents: 700000 },
          { label: 'Physio + recovery block', amountCents: 400000 },
        ],
      },
      {
        campaignSlug: 'new-running-blade',
        campaignTitle: 'New carbon running blade',
        campaignType: 'GEAR',
        campaignStory:
          'My current blade is three seasons and 8,000 km old. The new model returns more energy per stride — over a marathon, that is minutes.',
        targetAmountCents: 1200000,
        raisedAmountCents: 375000,
        supporterCount: 22,
        closesAt: null,
        costLines: [
          { label: 'Carbon running blade', amountCents: 950000 },
          { label: 'Custom socket fitting', amountCents: 250000 },
        ],
      },
    ],
    accomplishments: [
      { title: '1st Para Division, Montréal Marathon — 3:04:12', year: 2025 },
      { title: 'Canadian Para 5000m champion (T64)', year: 2025 },
      { title: 'Para course record, Québec City Half', year: 2024 },
    ],
  },
  {
    athleteSlug: 'priya-shah',
    fullName: 'Priya Shah',
    headline: 'Middle-distance runner chasing the Canadian 1500m standard',
    bio: 'I learned to race on a gravel oval behind my school in northeast Calgary. Now I hold a U Sports 1500m title and a 4:11.38 PB — four seconds from the national standard, and closing.',
    primarySport: 'TRACK_AND_FIELD',
    runnerLevel: 'COMPETITIVE',
    hometown: 'Calgary, AB',
    countryCode: 'CA',
    heroMediaUrl:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=70',
    values: ['Women in sport', 'South Asian representation', 'Education'],
    activeCampaignCount: 1,
    totalRaisedCents: 980000,
    campaigns: [
      {
        campaignSlug: 'standard-chase-2026',
        campaignTitle: 'The 4:07.50 season — meets, travel, coaching',
        campaignType: 'SEASON',
        campaignStory:
          'Fast 1500s happen in fast fields, and fast fields mean flying to them. This season is Victoria, Vancouver, Toronto, and a European tune-up — chasing four seconds.',
        targetAmountCents: 2400000,
        raisedAmountCents: 980000,
        supporterCount: 31,
        closesAt: '2026-06-01T23:59:59Z',
        costLines: [
          { label: 'Meet travel + entries (5 meets)', amountCents: 1100000 },
          { label: 'Coaching + track access', amountCents: 700000 },
          { label: 'Physio + recovery', amountCents: 350000 },
          { label: 'Spikes + kit', amountCents: 250000 },
        ],
      },
    ],
    accomplishments: [
      { title: 'U Sports 1500m champion', year: 2025 },
      { title: '4:11.38 1500m PB — Harry Jerome Classic', year: 2025 },
      { title: 'Canadian U23 1500m silver', year: 2024 },
    ],
  },
  {
    athleteSlug: 'jordan-blackhorse',
    fullName: 'Jordan Blackhorse',
    headline: 'Trail ultrarunner with a golden ticket to Western States',
    bio: 'I grew up on the Navajo Nation, where my grandfather woke me before dawn to run east toward the sunrise. Now I race 100-kilometre trails — 2nd overall at Black Canyon earned me a Western States spot, and I am carrying every rez kid who runs dirt roads at 5 a.m. with me.',
    primarySport: 'RUNNING',
    runnerLevel: 'ELITE',
    hometown: 'Flagstaff, AZ',
    countryCode: 'US',
    heroMediaUrl:
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1400&q=70',
    values: ['Indigenous representation', 'Rural outreach', 'Healthy living'],
    activeCampaignCount: 1,
    totalRaisedCents: 1230000,
    campaigns: [
      {
        campaignSlug: 'western-states-2026',
        campaignTitle: 'Western States 100 — crew, travel, and the big dance',
        campaignType: 'EVENT',
        campaignStory:
          'A golden ticket gets you to the start line, not through 100 miles. I need a crew of four, pacers, lodging in Olympic Valley, and a month at altitude to arrive ready.',
        targetAmountCents: 3200000,
        raisedAmountCents: 1230000,
        supporterCount: 89,
        closesAt: '2026-06-01T23:59:59Z',
        costLines: [
          { label: 'Crew travel + lodging (4 people)', amountCents: 1500000 },
          { label: 'Altitude camp — Olympic Valley', amountCents: 900000 },
          { label: 'Coaching + physio block', amountCents: 500000 },
          { label: 'Race nutrition + gear', amountCents: 300000 },
        ],
      },
    ],
    accomplishments: [
      { title: '2nd Overall, Black Canyon 100K — Golden Ticket', year: 2026 },
      { title: '1st Overall, Canyon de Chelly Ultra 55K', year: 2025 },
      { title: '1st Overall, Flagstaff Sky Peaks 50K', year: 2025 },
    ],
  },
  {
    athleteSlug: 'emma-chen',
    fullName: 'Emma Chen',
    headline: 'Run-club captain training for her first marathon',
    bio: 'Two years ago I could not run to the end of my block. A couch-to-5K plan, one very supportive Tuesday run club, and a 1:47 half marathon later — I am training for my first marathon. Proof that the person who starts from zero gets a story too.',
    primarySport: 'RUNNING',
    runnerLevel: 'EVERYDAY',
    hometown: 'Vancouver, BC',
    countryCode: 'CA',
    heroMediaUrl:
      'https://images.unsplash.com/photo-1540539234-c14a20fb7c7b?auto=format&fit=crop&w=1400&q=70',
    values: ['Consistency', 'Community', 'Joy'],
    activeCampaignCount: 0,
    totalRaisedCents: 0,
    campaigns: [],
    accomplishments: [
      { title: 'First sub-1:50 half — First Half Half Marathon', year: 2026 },
      { title: 'First sub-50 10K — Eastside 10K', year: 2025 },
      { title: 'First ever 5K — 31:06 and hooked', year: 2024 },
    ],
  },
  {
    athleteSlug: 'naomi-osei',
    fullName: 'Naomi Osei',
    headline: 'Everyday cyclist and year-round bike commuter chasing her first 100 km',
    bio: 'Two years ago my bike hung untouched in the garage. Now I commute by bike year-round, ride with a no-drop Saturday community club, and I am training for my first 100 km gran fondo. I do not race and I will probably never be fast — that is exactly the point. Cycling gave me my mornings, my headspace, and a whole community, and I want to show other everyday riders that they belong here too.',
    primarySport: 'ROAD_CYCLING',
    runnerLevel: 'EVERYDAY',
    hometown: 'Hamilton, ON',
    countryCode: 'CA',
    heroMediaUrl:
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=1400&q=70',
    values: ['Community', 'Consistency', 'Car-free living'],
    activeCampaignCount: 0,
    totalRaisedCents: 0,
    campaigns: [],
    accomplishments: [
      { title: 'Longest ride yet — 82 km', year: 2026 },
      { title: 'One full year of car-free commuting', year: 2025 },
      { title: 'First group ride with the Saturday club', year: 2024 },
    ],
  },
];

const RUNNER_SPORTS: MockAthlete['primarySport'][] = ['RUNNING', 'TRACK_AND_FIELD'];

// The launch directory + community feed stay runners-only. Non-running athletes
// (e.g. the cyclist pilot) still resolve their own profile page by slug.
export const runnerAthletes: MockAthlete[] = mockAthletes.filter((athlete) =>
  RUNNER_SPORTS.includes(athlete.primarySport),
);

export function findMockAthlete(slug: string): MockAthlete | undefined {
  return mockAthletes.find((athlete) => athlete.athleteSlug === slug);
}
