// Placeholder data used while the API is being wired up. The shapes mirror
// what `fad-common`'s `athleteDirectoryItemSchema` will return.
// Launch roster is runners-only; rich profile content lives in athleteProfiles.ts.

export type MockAthlete = {
  athleteSlug: string;
  fullName: string;
  headline: string;
  bio: string;
  primarySport: 'RUNNING' | 'TRACK_AND_FIELD';
  hometown: string;
  countryCode: 'CA' | 'US';
  heroMediaUrl: string;
  values: string[];
  activeCampaignCount: number;
  totalRaisedCents: number;
  campaigns: {
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
    athleteSlug: 'cassandra-de-winter',
    fullName: 'Cassandra de Winter',
    headline: 'Mother of three and ultra course-record holder chasing the Lost Soul 100-miler',
    bio: 'Mother of three, endurance athlete, and former national rugby player. In 2025 I returned to sport through endurance racing after a few years focused on my family — a quiet comeback that quickly turned into course records and podiums. My background in national-level rugby gave me a foundation, but stepping into the ultra world has felt like starting fresh in the most humbling way. My journey is about balancing high-level training with motherhood, and showing my kids — and other mothers — that there is still space for their own big goals.',
    primarySport: 'RUNNING',
    hometown: 'Lethbridge, AB',
    countryCode: 'CA',
    heroMediaUrl:
      'https://images.unsplash.com/photo-1502904550040-7534597429ae?auto=format&fit=crop&w=1400&q=70',
    values: ['Resilience', 'Sustainability', 'Community', 'Excellence'],
    activeCampaignCount: 1,
    totalRaisedCents: 945000,
    campaigns: [
      {
        campaignSlug: 'lost-soul-2026-season',
        campaignTitle: 'Fund my 2026 ultra season — Lost Soul 100-miler',
        campaignType: 'SEASON',
        campaignStory:
          'My 2026 build peaks at the Lost Soul 100-miler in September, with the Edmonton Half and Toronto Waterfront Marathon along the way. Entries, travel, coaching, and recovery for a full season of racing add up fast — every dollar keeps a mom of three on the start line.',
        targetAmountCents: 1500000,
        raisedAmountCents: 945000,
        supporterCount: 124,
        closesAt: '2026-09-11T23:59:59Z',
        costLines: [
          { label: 'Race entries — Edmonton, Lost Soul, Toronto', amountCents: 150000 },
          { label: 'Travel + accommodation', amountCents: 600000 },
          { label: 'Coaching + strength programming', amountCents: 350000 },
          { label: 'Trail shoes + race gear', amountCents: 200000 },
          { label: 'Physio + recovery', amountCents: 200000 },
        ],
      },
    ],
    accomplishments: [
      { title: '1st Canadian Female, Boston Marathon — 2:34:43 PB', year: 2026 },
      { title: '1st Overall & course record, Lost Soul Ultra 100km', year: 2025 },
      { title: '1st Female, Royal Victoria Marathon — 2:39:50', year: 2025 },
      { title: '1st Female & course record, Black Spur Ultra 54km', year: 2025 },
    ],
  },
  {
    athleteSlug: 'emma-chen',
    fullName: 'Emma Chen',
    headline: 'Run-club captain training for her first marathon',
    bio: 'Two years ago I could not run to the end of my block. A couch-to-5K plan, one very supportive Tuesday run club, and a 1:47 half marathon later — I am training for my first marathon. Proof that the person who starts from zero gets a story too.',
    primarySport: 'RUNNING',
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
];

export function findMockAthlete(slug: string): MockAthlete | undefined {
  return mockAthletes.find((athlete) => athlete.athleteSlug === slug);
}
