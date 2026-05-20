// Placeholder data used while the API is being wired up. The shapes mirror
// what `fad-common`'s `athleteDirectoryItemSchema` will return.

export type MockAthlete = {
  athleteSlug: string;
  fullName: string;
  headline: string;
  bio: string;
  primarySport:
    | 'RUNNING'
    | 'TRIATHLON'
    | 'CYCLING'
    | 'CLIMBING'
    | 'SKIING'
    | 'TRACK_AND_FIELD'
    | 'SWIMMING';
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
      { title: 'Canadian 10K silver', year: 2024 },
      { title: 'NCAA Cross-Country All-American', year: 2022 },
    ],
  },
  {
    athleteSlug: 'felix-tremblay',
    fullName: 'Félix Tremblay',
    headline: 'Para-Nordic skier targeting Milano Cortina 2026',
    bio: 'I lost my left leg in a snowmobile accident at 17. Five seasons later, I am two World Cup races away from clinching a Milano Cortina spot. I race for every kid sitting in a hospital wondering what is next.',
    primarySport: 'CROSS_COUNTRY_SKIING' as unknown as 'SKIING',
    hometown: 'Saguenay, QC',
    countryCode: 'CA',
    heroMediaUrl:
      'https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=1400&q=70',
    values: ['Adaptive sport', 'Resilience', 'Bilingual outreach'],
    activeCampaignCount: 2,
    totalRaisedCents: 2475000,
    campaigns: [
      {
        campaignSlug: 'world-cup-europe-block',
        campaignTitle: 'Three-week World Cup tour — Norway, Sweden, Finland',
        campaignType: 'TRAVEL',
        campaignStory:
          'Three races, three countries, three weeks. Hauling my sit-ski and bikes across Scandinavia is the most expensive part of the season — and it is where Olympic spots get won.',
        targetAmountCents: 3600000,
        raisedAmountCents: 2100000,
        supporterCount: 67,
        closesAt: '2025-11-30T23:59:59Z',
        costLines: [
          { label: 'Flights + sit-ski cargo fees', amountCents: 1500000 },
          { label: '3 weeks accommodation', amountCents: 1200000 },
          { label: 'Wax tech + service team', amountCents: 600000 },
          { label: 'Ground transport', amountCents: 300000 },
        ],
      },
      {
        campaignSlug: 'new-sit-ski',
        campaignTitle: 'New race sit-ski',
        campaignType: 'GEAR',
        campaignStory:
          'My current ski is four seasons old. The new carbon model is 2.1 kg lighter and the difference at the top of a 5 km climb is enormous.',
        targetAmountCents: 1200000,
        raisedAmountCents: 375000,
        supporterCount: 22,
        closesAt: null,
        costLines: [
          { label: 'Race sit-ski', amountCents: 950000 },
          { label: 'Custom seat moulding', amountCents: 250000 },
        ],
      },
    ],
    accomplishments: [
      { title: 'World Cup bronze, 15 km classic', year: 2025 },
      { title: 'Canadian Para-Nordic champion', year: 2024 },
      { title: 'Selected — Team Canada NextGen', year: 2023 },
    ],
  },
  {
    athleteSlug: 'priya-shah',
    fullName: 'Priya Shah',
    headline: 'Lead climber prepping for the IFSC World Cup',
    bio: 'I learned to climb on the prairie limestone outside Calgary. I am training in Innsbruck this winter to qualify for the World Cup tour — a place where Canadian women have never finished on a podium.',
    primarySport: 'CLIMBING',
    hometown: 'Calgary, AB',
    countryCode: 'CA',
    heroMediaUrl:
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=1400&q=70',
    values: ['Women in sport', 'South Asian representation', 'Education'],
    activeCampaignCount: 1,
    totalRaisedCents: 980000,
    campaigns: [
      {
        campaignSlug: 'innsbruck-training-block',
        campaignTitle: '8-week training block in Innsbruck',
        campaignType: 'TRAINING',
        campaignStory:
          'Innsbruck is where the World Cup field trains. Living and climbing there in February and March is the single biggest jump I can make this year.',
        targetAmountCents: 2400000,
        raisedAmountCents: 980000,
        supporterCount: 31,
        closesAt: '2026-01-20T23:59:59Z',
        costLines: [
          { label: 'Flights + visa', amountCents: 250000 },
          { label: '8 weeks training-camp lodging', amountCents: 1400000 },
          { label: 'Gym access + coach', amountCents: 550000 },
          { label: 'Physio + recovery', amountCents: 200000 },
        ],
      },
    ],
    accomplishments: [
      { title: 'Canadian Lead Climbing champion', year: 2025 },
      { title: 'Youth World Cup 4th place', year: 2023 },
      { title: 'First Indo-Canadian on national team', year: 2022 },
    ],
  },
  {
    athleteSlug: 'jordan-blackhorse',
    fullName: 'Jordan Blackhorse',
    headline: 'Ironman 70.3 pro working toward Kona',
    bio: 'I grew up on the Navajo Nation. I race triathlon to bring resources back to rural reservation kids who never see athletes who look like them on TV.',
    primarySport: 'TRIATHLON',
    hometown: 'Flagstaff, AZ',
    countryCode: 'US',
    heroMediaUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=70',
    values: ['Indigenous representation', 'Rural outreach', 'Healthy living'],
    activeCampaignCount: 1,
    totalRaisedCents: 1230000,
    campaigns: [
      {
        campaignSlug: 'ironman-70-3-worlds',
        campaignTitle: 'Ironman 70.3 World Championship — Marbella',
        campaignType: 'EVENT',
        campaignStory:
          'I earned a pro slot at Worlds. Marbella is 6,000 km away from my house and the season is already over my hotel-bill budget.',
        targetAmountCents: 3200000,
        raisedAmountCents: 1230000,
        supporterCount: 41,
        closesAt: '2026-09-01T23:59:59Z',
        costLines: [
          { label: 'Race entry + bike shipping', amountCents: 900000 },
          { label: 'Flights (FLG ↔ AGP)', amountCents: 1400000 },
          { label: '8 nights accommodation', amountCents: 700000 },
          { label: 'Race-week nutrition + recovery', amountCents: 200000 },
        ],
      },
    ],
    accomplishments: [
      { title: 'Ironman 70.3 Indian Wells pro podium', year: 2025 },
      { title: 'US Triathlon Elite Nationals 6th', year: 2024 },
      { title: 'NCAA Division II All-American', year: 2021 },
    ],
  },
];

export function findMockAthlete(slug: string): MockAthlete | undefined {
  return mockAthletes.find((athlete) => athlete.athleteSlug === slug);
}
