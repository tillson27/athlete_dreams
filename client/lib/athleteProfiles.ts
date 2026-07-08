// Rich, presentation-level profile data for the runner-launch roster.
// Mirrors what a future `athleteProfileSchema` in fad-common will return;
// keyed by athleteSlug and consumed by AthleteProfile.

export type ProfileTone = 'primary' | 'secondary';
export type ChapterTone = 'primary' | 'secondary' | 'tertiary';
export type ChapterIcon = 'medal' | 'heart' | 'history' | 'trophy' | 'flag' | 'timer' | 'book' | 'groups';

export type ArcChapter = {
  era: string;
  title: string;
  icon: ChapterIcon;
  tone: ChapterTone;
  body: string;
  image?: string;
  current?: boolean;
};

export type HighlightEntry = {
  title: string;
  detail: string;
  tone: ProfileTone;
  images: string[];
};

export type ExtraHighlight = {
  title: string;
  detail: string;
  images: string[];
};

export type RaceEntry = {
  name: string;
  date: string;
  result: string;
  tone: ProfileTone;
  links?: string[];
  images: string[];
};

export type ExtraRace = {
  name: string;
  date: string;
  result: string;
  images: string[];
};

export type RecentBacker = {
  name: string;
  when: string;
  amountCents: number;
  initials?: string;
  icon?: 'groups' | 'person';
};

export type RichAthleteProfile = {
  athleteSlug: string;
  handle: string;
  followers: string;
  disciplineLabel: string;
  arcSubtitle: string;
  storyIntro: string;
  storyBody: string[];
  personalBests: { label: string; value: string }[];
  careerHighlights: HighlightEntry[];
  moreResults: ExtraHighlight[];
  moreResultsLabel: string;
  previousRaces: RaceEntry[];
  morePreviousRaces: ExtraRace[];
  moreRacesLabel: string;
  roadmapTitle: string;
  roadmap: { name: string; date: string }[];
  coreValues: { title: string; body: string }[];
  arcChapters: ArcChapter[];
  instagramPosts: { id: string; likes: string }[];
  training: {
    weeklyKm: string;
    weeklyTime: string;
    weeklyGain: string;
    latestTitle: string;
    latestMeta: string;
  };
  galleryPhotos: string[];
  featuredVideo?: { image: string; duration: string };
  supportEnabled: boolean;
  backCtaBlurb?: string;
  recentBackers?: RecentBacker[];
  supporterCount?: number;
};

export const athleteProfiles: Record<string, RichAthleteProfile> = {
  'cassandra-de-winter': {
    athleteSlug: 'cassandra-de-winter',
    handle: '@cassandradewinter',
    followers: '12.4k',
    disciplineLabel: 'Elite Endurance & Trail',
    arcSubtitle:
      'From the rugby pitch to the podium — the chapters behind the athlete, in her own words.',
    storyIntro:
      'Mother of three, endurance athlete, and former national rugby player. My journey is about movement, competition, and showing my children what it looks like to chase big goals…',
    storyBody: [
      'My name is Cassandra de Winter, and before anything else, I’m a mom to three young kids. My mornings begin early, balancing training with the familiar rhythm of little ones waking before the sun and finding their way into my bedroom. However, in the midst of motherhood, I’ve found my way back to something that has always been part of who I am: movement, competition, and the drive to push my limits.',
      'In 2025, after a few years focused on growing my family, I returned to sport through endurance racing. What started as a quiet comeback quickly turned into something much bigger. Running became more than just training—it became a way to reconnect with myself, to rediscover strength, and to show my children what it looks like to chase something wholeheartedly.',
      'My background in national-level rugby and strength sport gave me a foundation, but stepping into the endurance world has felt like starting fresh in the most humbling and exciting way. I’m new to this space, which means I bring a different kind of perspective—one rooted in gratitude, curiosity, and a deep respect for the process.',
      'My journey is about more than performance—it’s about the life around it. Balancing high-level training with motherhood, finding purpose in both, and inviting others—especially women and mothers—to believe that there is still space for their own ambitions.',
    ],
    personalBests: [
      { label: '10km', value: '35:26' },
      { label: 'Half Marathon', value: '1:12:54' },
      { label: 'Marathon', value: '2:34:43' },
      { label: '100km', value: '10:03:12' },
    ],
    careerHighlights: [
      {
        title: '2026 Boston Marathon',
        detail: '1st Canadian Female (27th Overall) — 2:34:43',
        tone: 'secondary',
        images: ['1552674605-db6ffd4facb5', '1461896836934-ffe607ba8211'],
      },
      {
        title: '2025 Lost Soul Ultra 100km',
        detail: '1st Overall (Course Record) — 10:03',
        tone: 'primary',
        images: ['1476480862126-209bfaa8edc8', '1519750157634-b6d493a0f77c'],
      },
    ],
    moreResults: [
      {
        title: '2025 Royal Victoria Marathon',
        detail: '1st Place Female — 2:39:50',
        images: ['1508973379184-7517410fb0bc', '1530143311094-34d807799e8f'],
      },
      {
        title: '2025 Black Spur Ultra 54km',
        detail: '1st Place Female (Course Record) — 5:26:00',
        images: ['1517637633369-e4cc28755e01', '1486218119243-13883505764c'],
      },
    ],
    moreResultsLabel: 'See more results',
    previousRaces: [
      {
        name: 'Boston Marathon (Pro Start)',
        date: 'Monday, April 20, 2026',
        result: '1st Canadian Female — 2:34:43 (PB)',
        tone: 'secondary',
        links: ['Official B.A.A. Results', 'Running Magazine Recap', 'CBC Article'],
        images: ['1540539234-c14a20fb7c7b'],
      },
      {
        name: 'Moonlight Run 10K',
        date: 'Saturday, March 21, 2026',
        result: '1st Female, CR — 35:26',
        tone: 'primary',
        links: ['10K Results', 'Timing Page'],
        images: ['1486739985386-d4fae04ca6f7'],
      },
      {
        name: 'Mesa Half Marathon',
        date: 'Saturday, February 14, 2026',
        result: '4th Female — 1:12:54',
        tone: 'secondary',
        links: ['World Athletics Results', 'Official Mesa Marathon Results'],
        images: ['1596727147705-61a532a659bd', '1533560904424-a0c61dc306fc'],
      },
    ],
    morePreviousRaces: [
      {
        name: 'Royal Victoria Marathon',
        date: 'Oct 12, 2025',
        result: '1st Female — 2:39:50',
        images: ['1530143311094-34d807799e8f', '1508973379184-7517410fb0bc'],
      },
      {
        name: 'Lost Soul Ultra 100km',
        date: 'Sept 5–6, 2025',
        result: '1st Overall, CR — 10:03:12',
        images: ['1476480862126-209bfaa8edc8', '1519750157634-b6d493a0f77c'],
      },
      {
        name: 'Black Spur Ultra 54km',
        date: 'Aug 22–23, 2025',
        result: '1st Female, CR — 5:26:00',
        images: ['1533560904424-a0c61dc306fc', '1596727147705-61a532a659bd'],
      },
    ],
    moreRacesLabel: 'See more races (2025 & prior)',
    roadmapTitle: '2026 Roadmap',
    roadmap: [
      { name: 'Edmonton Half Marathon', date: 'August 16, 2026' },
      { name: 'Lost Soul 100-miler', date: 'Sept 11, 2026' },
      { name: 'Toronto Waterfront Marathon', date: 'Oct 17-18, 2026' },
    ],
    coreValues: [
      { title: 'Resilience', body: 'Pushing beyond limits.' },
      { title: 'Sustainability', body: 'Earth-first athletics.' },
      { title: 'Community', body: 'Growing the trail scene.' },
      { title: 'Excellence', body: 'Uncompromising quality.' },
    ],
    arcChapters: [
      {
        era: 'Before Arc',
        title: 'National rugby',
        icon: 'medal',
        tone: 'secondary',
        body: 'Before endurance, sport meant rugby — at the national level. Competition has always been part of who I am.',
      },
      {
        era: '2020 – 2024',
        title: 'Motherhood',
        icon: 'heart',
        tone: 'tertiary',
        body: 'Three kids in a few short years. My mornings became early wake-ups and little ones finding their way into my bed. I stepped back from the start line — but never from the drive.',
      },
      {
        era: '2025',
        title: 'The return',
        icon: 'history',
        tone: 'primary',
        image: '1502904550040-7534597429ae',
        body: 'A quiet comeback through endurance racing. What began as a way to reconnect with myself quickly turned into something far bigger.',
      },
      {
        era: '2025 – 2026',
        title: 'The breakthrough',
        icon: 'trophy',
        tone: 'primary',
        body: '1st Overall and a course record at the Lost Soul 100 km. 1st Canadian Female at Boston. The comeback became a breakthrough.',
      },
      {
        era: 'Now',
        title: 'What I’m chasing',
        icon: 'flag',
        tone: 'primary',
        current: true,
        body: 'The Lost Soul 100-miler this September — my biggest goal yet. I’m running it to show my kids what chasing something wholeheartedly looks like.',
      },
    ],
    instagramPosts: [
      { id: '1502904550040-7534597429ae', likes: '1.2k' },
      { id: '1486218119243-13883505764c', likes: '856' },
      { id: '1517637633369-e4cc28755e01', likes: '2.3k' },
    ],
    training: {
      weeklyKm: '84.2',
      weeklyTime: '12h 15m',
      weeklyGain: '2,450m',
      latestTitle: 'Interval Session: Speed Work',
      latestMeta: 'Yesterday • 12.0 km • 52:10',
    },
    galleryPhotos: [
      '1594882645126-14020914d58d',
      '1530143311094-34d807799e8f',
      '1596727147705-61a532a659bd',
      '1552674605-db6ffd4facb5',
    ],
    featuredVideo: { image: '1461896836934-ffe607ba8211', duration: '2:45' },
    supportEnabled: true,
    backCtaBlurb: 'Back my 2026 season',
    recentBackers: [
      { name: 'Sarah M.', when: '2 days ago', amountCents: 5000, initials: 'SM' },
      { name: 'RunClub Toronto', when: '3 days ago', amountCents: 20000, icon: 'groups' },
      { name: 'Anonymous', when: '5 days ago', amountCents: 2500, icon: 'person' },
    ],
    supporterCount: 124,
  },

  'maya-okafor': {
    athleteSlug: 'maya-okafor',
    handle: '@maya.runs.far',
    followers: '9.8k',
    disciplineLabel: 'Road Marathon',
    arcSubtitle:
      'From med-school stress runs to the Boston pro corral — the chapters behind the athlete, in her own words.',
    storyIntro:
      'Resident physician, marathoner, and first-generation athlete. I started running to stay sane during med school — five years later I’m chasing a sub-2:30 in Tokyo…',
    storyBody: [
      'I’m Maya. I split my childhood between Lagos and Toronto, and sport was the one language that worked in both places. But running didn’t become mine until med school, when forty-minute loops around the hospital were the only thing keeping my head above water.',
      'Those stress runs turned into workouts, workouts turned into races, and somewhere along the way the hobby became a second calling. In 2025 I ran 2:34:11 at Boston — a number I didn’t believe belonged to me until I saw it on the clock.',
      'Now I’m chasing a sub-2:30 at the Tokyo Marathon while finishing my residency. The double life is chaos, but it’s the point: I run to show the kids in my Lagos neighbourhood — and my patients — that bodies move and minds heal.',
      'Being first-generation means nobody hands you the map. I want my racing to be a map for someone else.',
    ],
    personalBests: [
      { label: '5km', value: '16:12' },
      { label: '10km', value: '33:28' },
      { label: 'Half Marathon', value: '1:11:58' },
      { label: 'Marathon', value: '2:34:11' },
    ],
    careerHighlights: [
      {
        title: '2025 Boston Marathon',
        detail: '2:34:11 (PB) — 14th Female',
        tone: 'secondary',
        images: ['1540539234-c14a20fb7c7b', '1461896836934-ffe607ba8211'],
      },
      {
        title: '2026 Houston Half Marathon',
        detail: '1:11:58 (PB) — 8th Female',
        tone: 'primary',
        images: ['1594882645126-14020914d58d', '1483721310020-03333e577078'],
      },
    ],
    moreResults: [
      {
        title: '2024 Canadian 10K Championships',
        detail: 'Silver — 33:28',
        images: ['1461897104016-0b3b00cc81ee', '1533560904424-a0c61dc306fc'],
      },
      {
        title: '2022 NCAA Cross-Country Championships',
        detail: 'All-American — 22nd',
        images: ['1452626038306-9aae5e071dd3', '1596727147705-61a532a659bd'],
      },
    ],
    moreResultsLabel: 'See more results',
    previousRaces: [
      {
        name: 'Houston Half Marathon',
        date: 'Sunday, January 18, 2026',
        result: '8th Female — 1:11:58 (PB)',
        tone: 'secondary',
        links: ['Official Houston Results', 'Strava Activity'],
        images: ['1594882645126-14020914d58d'],
      },
      {
        name: 'Toronto Waterfront Marathon',
        date: 'Sunday, October 19, 2025',
        result: '1st Canadian Female — 2:35:12',
        tone: 'primary',
        links: ['Official Results', 'Canadian Running Recap'],
        images: ['1530143311094-34d807799e8f'],
      },
      {
        name: 'Boston Marathon',
        date: 'Monday, April 21, 2025',
        result: '14th Female — 2:34:11 (PB)',
        tone: 'secondary',
        links: ['Official B.A.A. Results', 'World Athletics Profile'],
        images: ['1540539234-c14a20fb7c7b', '1461896836934-ffe607ba8211'],
      },
    ],
    morePreviousRaces: [
      {
        name: 'Canadian 10K Championships',
        date: 'Jun 8, 2024',
        result: 'Silver — 33:28',
        images: ['1461897104016-0b3b00cc81ee', '1533560904424-a0c61dc306fc'],
      },
      {
        name: 'Ottawa Half Marathon',
        date: 'May 25, 2024',
        result: '3rd Female — 1:12:40',
        images: ['1452626038306-9aae5e071dd3', '1596727147705-61a532a659bd'],
      },
    ],
    moreRacesLabel: 'See more races (2024 & prior)',
    roadmapTitle: 'Road to Tokyo',
    roadmap: [
      { name: 'Tokyo Marathon — sub-2:30 attempt', date: 'March 1, 2026' },
      { name: 'Ottawa 10K', date: 'May 23, 2026' },
      { name: 'Berlin Marathon', date: 'September 27, 2026' },
    ],
    coreValues: [
      { title: 'Mental health', body: 'Running is medicine.' },
      { title: 'First-gen grit', body: 'Drawing maps for others.' },
      { title: 'Mentorship', body: 'Lifting the next runner.' },
      { title: 'Discipline', body: 'Residency + 150k weeks.' },
    ],
    arcChapters: [
      {
        era: '1998 – 2016',
        title: 'Two cities',
        icon: 'book',
        tone: 'secondary',
        body: 'Lagos and Toronto. Two homes, one constant: I was always the kid who ran everywhere. I just didn’t know yet that it counted for something.',
      },
      {
        era: '2018 – 2022',
        title: 'The walk-on',
        icon: 'medal',
        tone: 'tertiary',
        body: 'I walked onto my university cross-country team with no accolades and a lot to prove. Four years later I left an NCAA All-American.',
      },
      {
        era: '2022 – 2024',
        title: 'Running to stay sane',
        icon: 'heart',
        tone: 'primary',
        body: 'Med school nearly swallowed me. Forty-minute loops around the hospital became the one hour a day that was mine. The miles added up quietly.',
      },
      {
        era: '2025',
        title: 'Boston',
        icon: 'trophy',
        tone: 'primary',
        image: '1540539234-c14a20fb7c7b',
        body: '2:34:11. I stared at the clock at the finish on Boylston and didn’t believe the number was mine. The hobby officially became a second calling.',
      },
      {
        era: 'Now',
        title: 'Sub-2:30 or bust',
        icon: 'flag',
        tone: 'primary',
        current: true,
        body: 'Tokyo, March 2026. Chasing a 2:2X while finishing residency — to show my patients and the kids back home that bodies move and minds heal.',
      },
    ],
    instagramPosts: [
      { id: '1571008887538-b36bb32f4571', likes: '980' },
      { id: '1452626038306-9aae5e071dd3', likes: '1.4k' },
      { id: '1490578474895-699cd4e2cf59', likes: '763' },
    ],
    training: {
      weeklyKm: '152.4',
      weeklyTime: '11h 05m',
      weeklyGain: '640m',
      latestTitle: 'Long Run: 36 km progression',
      latestMeta: 'Sunday • 36.0 km • 2:24:10',
    },
    galleryPhotos: [
      '1594882645126-14020914d58d',
      '1461897104016-0b3b00cc81ee',
      '1483721310020-03333e577078',
      '1530143311094-34d807799e8f',
    ],
    supportEnabled: true,
    backCtaBlurb: 'Get me to the Tokyo start line',
    recentBackers: [
      { name: 'Dr. A. Patel', when: '1 day ago', amountCents: 10000, initials: 'AP' },
      { name: 'Hospital Run Crew', when: '4 days ago', amountCents: 15000, icon: 'groups' },
      { name: 'Anonymous', when: '6 days ago', amountCents: 5000, icon: 'person' },
    ],
    supporterCount: 48,
  },

  'felix-tremblay': {
    athleteSlug: 'felix-tremblay',
    handle: '@felix.court.encore',
    followers: '6.2k',
    disciplineLabel: 'Para Road Racing',
    arcSubtitle:
      'From a hospital bed at 17 to the marathon start line — the chapters behind the athlete, in his own words.',
    storyIntro:
      'I lost my left leg in a snowmobile accident at 17. Six years later, I race marathons on a running blade — and I’m chasing the Boston para division…',
    storyBody: [
      'Je m’appelle Félix. I grew up in Saguenay playing hockey and running the hills behind our house — until a snowmobile accident at 17 took my left leg below the knee and, for a while, everything I thought I was.',
      'Rehab teaches you to count small wins: sitting up, standing, one step. The day I jogged ten metres on a borrowed running blade, I cried in front of the whole physio ward. Nobody there thought it was strange.',
      'Running gave me back forward motion — literally. I went from a first 5K where I stopped six times, to para nationals, to finishing the Montréal Marathon in 3:04. Every race, I carry the kids I met in the hospital who are still waiting for their own first step.',
      'Boston has a para division now. April 2026, je serai là. And I’ll be answering every message in French and English on the way — because a kid in Chicoutimi deserves the same map as a kid in Boston.',
    ],
    personalBests: [
      { label: '5km', value: '18:47' },
      { label: '10km', value: '38:56' },
      { label: 'Half Marathon', value: '1:26:40' },
      { label: 'Marathon', value: '3:04:12' },
    ],
    careerHighlights: [
      {
        title: '2025 Montréal Marathon',
        detail: '1st Para Division — 3:04:12 (PB)',
        tone: 'secondary',
        images: ['1530143311094-34d807799e8f', '1540539234-c14a20fb7c7b'],
      },
      {
        title: '2025 Canadian Para Athletics Championships',
        detail: 'Gold — 5000m (T64)',
        tone: 'primary',
        images: ['1461896836934-ffe607ba8211', '1483721310020-03333e577078'],
      },
    ],
    moreResults: [
      {
        title: '2024 Québec City Half Marathon',
        detail: 'Para course record — 1:26:40',
        images: ['1594882645126-14020914d58d', '1461897104016-0b3b00cc81ee'],
      },
      {
        title: '2023 Défi Entreprises 5K',
        detail: 'First race back — 24:51',
        images: ['1517637633369-e4cc28755e01', '1486739985386-d4fae04ca6f7'],
      },
    ],
    moreResultsLabel: 'See more results',
    previousRaces: [
      {
        name: 'Marathon Beneva de Montréal',
        date: 'Sunday, September 21, 2025',
        result: '1st Para Division — 3:04:12 (PB)',
        tone: 'secondary',
        links: ['Official Results', 'Radio-Canada Feature'],
        images: ['1540539234-c14a20fb7c7b'],
      },
      {
        name: 'Canadian Para Athletics Championships — 5000m',
        date: 'Saturday, June 28, 2025',
        result: 'Gold (T64) — 19:02',
        tone: 'primary',
        links: ['Athletics Canada Results'],
        images: ['1461896836934-ffe607ba8211'],
      },
      {
        name: 'Québec City Half Marathon',
        date: 'Sunday, April 27, 2025',
        result: '1st Para — 1:26:40 (CR)',
        tone: 'secondary',
        links: ['Sportstats Results', 'Le Soleil Recap'],
        images: ['1530143311094-34d807799e8f', '1452626038306-9aae5e071dd3'],
      },
    ],
    morePreviousRaces: [
      {
        name: 'Défi Entreprises 10K',
        date: 'Jun 7, 2024',
        result: '1st Para — 41:33',
        images: ['1533560904424-a0c61dc306fc', '1596727147705-61a532a659bd'],
      },
      {
        name: 'Course du Fjord 5K',
        date: 'Aug 17, 2023',
        result: 'First race on the blade — 24:51',
        images: ['1461897104016-0b3b00cc81ee', '1594882645126-14020914d58d'],
      },
    ],
    moreRacesLabel: 'See more races (2024 & prior)',
    roadmapTitle: 'Road to Boston',
    roadmap: [
      { name: 'Boston Marathon — Para Division', date: 'April 20, 2026' },
      { name: 'Ottawa Marathon', date: 'May 24, 2026' },
      { name: 'Marathon Beneva de Montréal', date: 'September 20, 2026' },
    ],
    coreValues: [
      { title: 'Adaptive sport', body: 'Different start, same finish line.' },
      { title: 'Resilience', body: 'Count the small wins.' },
      { title: 'Bilingual outreach', body: 'Every kid gets the map.' },
      { title: 'Joy', body: 'Forward motion is a gift.' },
    ],
    arcChapters: [
      {
        era: '2002 – 2019',
        title: 'Hockey and hills',
        icon: 'medal',
        tone: 'secondary',
        body: 'A Saguenay kid: hockey in winter, running the hills behind the house in summer. Sport was just how days ended.',
      },
      {
        era: '2019',
        title: 'The accident',
        icon: 'heart',
        tone: 'tertiary',
        body: 'A snowmobile accident at 17 took my left leg below the knee. For months, the only race was getting out of bed.',
      },
      {
        era: '2020 – 2022',
        title: 'Learning everything twice',
        icon: 'history',
        tone: 'primary',
        body: 'Sitting up. Standing. Walking. Then, on a borrowed running blade, ten jogging metres in the physio ward — and tears nobody found strange.',
      },
      {
        era: '2023 – 2025',
        title: 'The comeback tour',
        icon: 'trophy',
        tone: 'primary',
        image: '1594882645126-14020914d58d',
        body: 'A first 5K with six walk breaks became a para 5000m national title and a 3:04 marathon in Montréal. Forward motion, compounding.',
      },
      {
        era: 'Now',
        title: 'Boston, para division',
        icon: 'flag',
        tone: 'primary',
        current: true,
        body: 'April 2026. Je serai là — racing for every kid I met in the hospital who’s still waiting on their first step.',
      },
    ],
    instagramPosts: [
      { id: '1483721310020-03333e577078', likes: '742' },
      { id: '1461897104016-0b3b00cc81ee', likes: '1.1k' },
      { id: '1486739985386-d4fae04ca6f7', likes: '689' },
    ],
    training: {
      weeklyKm: '96.8',
      weeklyTime: '8h 40m',
      weeklyGain: '720m',
      latestTitle: 'Tempo: 3× 3km @ HM effort',
      latestMeta: 'Yesterday • 14.2 km • 1:04:30',
    },
    galleryPhotos: [
      '1594882645126-14020914d58d',
      '1452626038306-9aae5e071dd3',
      '1483721310020-03333e577078',
      '1530143311094-34d807799e8f',
    ],
    supportEnabled: true,
    backCtaBlurb: 'Get me to the Boston para start',
    recentBackers: [
      { name: 'Club de course Saguenay', when: '1 day ago', amountCents: 25000, icon: 'groups' },
      { name: 'Marie-Ève L.', when: '3 days ago', amountCents: 5000, initials: 'ML' },
      { name: 'Anonymous', when: '1 week ago', amountCents: 2500, icon: 'person' },
    ],
    supporterCount: 67,
  },

  'priya-shah': {
    athleteSlug: 'priya-shah',
    handle: '@priya.on.track',
    followers: '4.7k',
    disciplineLabel: 'Track — Middle Distance',
    arcSubtitle:
      'From a gravel oval behind a Calgary school to the national standard — the chapters behind the athlete, in her own words.',
    storyIntro:
      'Middle-distance runner chasing the Canadian 1500m standard — and trying to be the athlete I never saw on TV growing up…',
    storyBody: [
      'I learned to race on a 400m gravel oval behind my school in northeast Calgary. No spikes, no timing chips — just a teacher with a stopwatch and a line of kids who wanted to be first to the fence.',
      'Track chose me before I chose it. But choosing it back was harder: I didn’t see South Asian women on start lines, and for a long time I wondered if the sport had a lane for me. It does. I’m in it.',
      'In 2025 I won the U Sports 1500m title and ran 4:11.38 at the Harry Jerome Classic. The national standard is 4:07.50. That’s four seconds — a lifetime and nothing at all.',
      'When I’m not training, I tutor math for high-schoolers in my old neighbourhood. Fast legs matter less to me than a kid seeing someone with her name run on TV.',
    ],
    personalBests: [
      { label: '800m', value: '2:06.94' },
      { label: '1500m', value: '4:11.38' },
      { label: '3000m', value: '9:04.51' },
      { label: '5000m', value: '15:52.10' },
    ],
    careerHighlights: [
      {
        title: '2025 U Sports Championships',
        detail: 'Gold — 1500m (4:14.02)',
        tone: 'secondary',
        images: ['1461896836934-ffe607ba8211', '1461897104016-0b3b00cc81ee'],
      },
      {
        title: '2025 Harry Jerome Classic',
        detail: '1500m — 4:11.38 (PB)',
        tone: 'primary',
        images: ['1483721310020-03333e577078', '1461897104016-0b3b00cc81ee'],
      },
    ],
    moreResults: [
      {
        title: '2024 Canadian U23 Championships',
        detail: 'Silver — 1500m',
        images: ['1452626038306-9aae5e071dd3', '1533560904424-a0c61dc306fc'],
      },
      {
        title: '2024 Victoria Track Classic',
        detail: '3000m — 9:04.51 (PB)',
        images: ['1461896836934-ffe607ba8211', '1594882645126-14020914d58d'],
      },
    ],
    moreResultsLabel: 'See more results',
    previousRaces: [
      {
        name: 'Harry Jerome Track Classic — 1500m',
        date: 'Friday, June 13, 2025',
        result: '4th — 4:11.38 (PB)',
        tone: 'secondary',
        links: ['World Athletics Results', 'Athletics Canada Recap'],
        images: ['1461897104016-0b3b00cc81ee'],
      },
      {
        name: 'U Sports Championships — 1500m',
        date: 'Saturday, March 8, 2025',
        result: 'Gold — 4:14.02',
        tone: 'primary',
        links: ['U Sports Results', 'The Gauntlet Feature'],
        images: ['1461896836934-ffe607ba8211'],
      },
      {
        name: 'Victoria Track Classic — 5000m',
        date: 'Saturday, May 17, 2025',
        result: '6th — 15:52.10 (PB)',
        tone: 'secondary',
        links: ['Official Results'],
        images: ['1483721310020-03333e577078', '1461897104016-0b3b00cc81ee'],
      },
    ],
    morePreviousRaces: [
      {
        name: 'Canadian U23 Championships — 1500m',
        date: 'Jul 27, 2024',
        result: 'Silver — 4:15.87',
        images: ['1452626038306-9aae5e071dd3', '1533560904424-a0c61dc306fc'],
      },
      {
        name: 'Edmonton Indoor Open — 800m',
        date: 'Feb 10, 2024',
        result: '1st — 2:06.94 (PB)',
        images: ['1461896836934-ffe607ba8211', '1594882645126-14020914d58d'],
      },
    ],
    moreRacesLabel: 'See more races (2024 & prior)',
    roadmapTitle: 'Chasing 4:07.50',
    roadmap: [
      { name: 'Canadian Championships — 1500m', date: 'June 26, 2026' },
      { name: 'Harry Jerome Track Classic', date: 'July 10, 2026' },
      { name: 'NACAC Championships (goal)', date: 'August 2026' },
    ],
    coreValues: [
      { title: 'Women in sport', body: 'Claiming the lane.' },
      { title: 'Representation', body: 'Be who you needed to see.' },
      { title: 'Education', body: 'Math tutor on rest days.' },
      { title: 'Grit', body: 'Four seconds at a time.' },
    ],
    arcChapters: [
      {
        era: '2008 – 2016',
        title: 'The gravel oval',
        icon: 'book',
        tone: 'secondary',
        body: 'A 400m gravel loop behind a northeast Calgary school, a teacher with a stopwatch, and a kid who had to be first to the fence.',
      },
      {
        era: '2017 – 2020',
        title: 'First spikes',
        icon: 'medal',
        tone: 'tertiary',
        body: 'High-school provincials taught me I was fast. The stands taught me something harder: nobody on the podium looked like me.',
      },
      {
        era: '2021 – 2025',
        title: 'Claiming the lane',
        icon: 'trophy',
        tone: 'primary',
        image: '1483721310020-03333e577078',
        body: 'A U Sports 1500m title and a 4:11.38 PB at Harry Jerome. The question stopped being whether I belong — it became how fast.',
      },
      {
        era: 'Now',
        title: 'Four seconds',
        icon: 'flag',
        tone: 'primary',
        current: true,
        body: 'The national standard is 4:07.50. Four seconds is a lifetime and nothing at all — and I plan to find them by June.',
      },
    ],
    instagramPosts: [
      { id: '1461896836934-ffe607ba8211', likes: '512' },
      { id: '1483721310020-03333e577078', likes: '834' },
      { id: '1594882645126-14020914d58d', likes: '460' },
    ],
    training: {
      weeklyKm: '92.6',
      weeklyTime: '7h 55m',
      weeklyGain: '310m',
      latestTitle: 'Track: 6× 800m @ 3K pace',
      latestMeta: 'Tuesday • 11.5 km • 58:40',
    },
    galleryPhotos: [
      '1461897104016-0b3b00cc81ee',
      '1530143311094-34d807799e8f',
      '1483721310020-03333e577078',
      '1461896836934-ffe607ba8211',
    ],
    supportEnabled: true,
    backCtaBlurb: 'Back my season on the track',
    recentBackers: [
      { name: 'Calgary Track Collective', when: '2 days ago', amountCents: 15000, icon: 'groups' },
      { name: 'N. Shah', when: '5 days ago', amountCents: 10000, initials: 'NS' },
      { name: 'Anonymous', when: '1 week ago', amountCents: 2500, icon: 'person' },
    ],
    supporterCount: 31,
  },

  'jordan-blackhorse': {
    athleteSlug: 'jordan-blackhorse',
    handle: '@jordan.blackhorse.runs',
    followers: '15.1k',
    disciplineLabel: 'Trail & Ultra',
    arcSubtitle:
      'From dawn runs on the Navajo Nation to a Western States golden ticket — the chapters behind the athlete, in his own words.',
    storyIntro:
      'I grew up running toward the sunrise on the Navajo Nation. Now I race 100-kilometre trails — and this June, Western States…',
    storyBody: [
      'Yá’át’ééh — I’m Jordan. On the Navajo Nation, running isn’t a workout; it’s older than that. My grandfather woke me before dawn to run east toward the sunrise, the way his grandfather woke him. I’ve been running toward something ever since.',
      'College cross-country in Division II gave me structure and a 2:28 marathon. But the roads always felt like borrowed shoes. The first time I raced 50 kilometres of singletrack above Flagstaff, I understood: the long way home was the whole point.',
      'In February I finished 2nd overall at the Black Canyon 100K — a golden ticket to the Western States Endurance Run. One hundred miles, Olympic Valley to Auburn. The biggest stage in our sport.',
      'I race for the rez kids who run dirt roads at 5 a.m. like I did, with no idea it can take them anywhere. Every start line I reach, I want to hold the door open behind me.',
    ],
    personalBests: [
      { label: 'Marathon', value: '2:28:54' },
      { label: '50km', value: '3:41:20' },
      { label: '100km', value: '8:58:47' },
      { label: 'Vert in a week', value: '5,900m' },
    ],
    careerHighlights: [
      {
        title: '2026 Black Canyon 100K',
        detail: '2nd Overall — 8:58:47 (Golden Ticket)',
        tone: 'secondary',
        images: ['1519750157634-b6d493a0f77c', '1594882645126-14020914d58d'],
      },
      {
        title: '2025 Flagstaff Sky Peaks 50K',
        detail: '1st Overall — 4:02:11',
        tone: 'primary',
        images: ['1465188162913-8fb5709d6d57', '1476480862126-209bfaa8edc8'],
      },
    ],
    moreResults: [
      {
        title: '2025 Canyon de Chelly Ultra 55K',
        detail: '1st Overall — home-soil win',
        images: ['1517637633369-e4cc28755e01', '1486218119243-13883505764c'],
      },
      {
        title: '2024 Javelina Jangover 75K',
        detail: '3rd Overall — 6:48:02',
        images: ['1486739985386-d4fae04ca6f7', '1533560904424-a0c61dc306fc'],
      },
    ],
    moreResultsLabel: 'See more results',
    previousRaces: [
      {
        name: 'Black Canyon 100K',
        date: 'Saturday, February 14, 2026',
        result: '2nd Overall — 8:58:47 (Golden Ticket)',
        tone: 'secondary',
        links: ['UltraSignup Results', 'iRunFar Coverage', 'Golden Ticket Announcement'],
        images: ['1465188162913-8fb5709d6d57'],
      },
      {
        name: 'Canyon de Chelly Ultra 55K',
        date: 'Saturday, October 11, 2025',
        result: '1st Overall — 4:31:26',
        tone: 'primary',
        links: ['Official Results', 'Navajo Times Feature'],
        images: ['1486218119243-13883505764c'],
      },
      {
        name: 'Flagstaff Sky Peaks 50K',
        date: 'Saturday, September 6, 2025',
        result: '1st Overall — 4:02:11',
        tone: 'secondary',
        links: ['UltraSignup Results', 'Strava Activity'],
        images: ['1519750157634-b6d493a0f77c', '1476480862126-209bfaa8edc8'],
      },
    ],
    morePreviousRaces: [
      {
        name: 'Javelina Jangover 75K',
        date: 'Sep 28, 2024',
        result: '3rd Overall — 6:48:02',
        images: ['1486739985386-d4fae04ca6f7', '1517637633369-e4cc28755e01'],
      },
      {
        name: 'Phoenix Marathon',
        date: 'Feb 24, 2024',
        result: '5th Overall — 2:28:54 (PB)',
        images: ['1533560904424-a0c61dc306fc', '1486218119243-13883505764c'],
      },
    ],
    moreRacesLabel: 'See more races (2024 & prior)',
    roadmapTitle: 'The Big Dance',
    roadmap: [
      { name: 'Western States 100', date: 'June 27, 2026' },
      { name: 'Flagstaff Sky Peaks 50K (title defense)', date: 'September 5, 2026' },
      { name: 'Canyon de Chelly Ultra', date: 'October 10, 2026' },
    ],
    coreValues: [
      { title: 'Tradition', body: 'Run east, before dawn.' },
      { title: 'Representation', body: 'Rez kids belong on podiums.' },
      { title: 'Rural outreach', body: 'Shoes and buses for the Nation.' },
      { title: 'Healthy living', body: 'Running as medicine.' },
    ],
    arcChapters: [
      {
        era: '2001 – 2015',
        title: 'Running toward the sun',
        icon: 'heart',
        tone: 'secondary',
        body: 'My grandfather woke me before dawn to run east toward the sunrise, the way his grandfather woke him. Running was never exercise. It was who we are.',
      },
      {
        era: '2016 – 2021',
        title: 'Borrowed shoes',
        icon: 'medal',
        tone: 'tertiary',
        body: 'Division II cross-country and a 2:28 road marathon. Good years — but the roads always felt like borrowed shoes.',
      },
      {
        era: '2022 – 2025',
        title: 'The long way home',
        icon: 'history',
        tone: 'primary',
        image: '1465188162913-8fb5709d6d57',
        body: 'My first 50K of singletrack above Flagstaff rearranged everything. Then a home-soil win at Canyon de Chelly, on trails my family has known for generations.',
      },
      {
        era: '2026',
        title: 'The golden ticket',
        icon: 'trophy',
        tone: 'primary',
        body: '2nd overall at Black Canyon 100K — 8:58:47 and a spot in the Western States Endurance Run. The biggest stage in our sport.',
      },
      {
        era: 'Now',
        title: 'States',
        icon: 'flag',
        tone: 'primary',
        current: true,
        body: 'One hundred miles, Olympic Valley to Auburn, June 27. I’m carrying every rez kid who runs dirt roads at 5 a.m. with me.',
      },
    ],
    instagramPosts: [
      { id: '1476480862126-209bfaa8edc8', likes: '3.1k' },
      { id: '1533560904424-a0c61dc306fc', likes: '2.2k' },
      { id: '1519750157634-b6d493a0f77c', likes: '1.8k' },
    ],
    training: {
      weeklyKm: '141.7',
      weeklyTime: '13h 20m',
      weeklyGain: '3,850m',
      latestTitle: 'Long: Kachina Peaks loop',
      latestMeta: 'Saturday • 34.0 km • 3:41:05',
    },
    galleryPhotos: [
      '1517637633369-e4cc28755e01',
      '1465188162913-8fb5709d6d57',
      '1519750157634-b6d493a0f77c',
      '1486739985386-d4fae04ca6f7',
    ],
    featuredVideo: { image: '1465188162913-8fb5709d6d57', duration: '4:12' },
    supportEnabled: true,
    backCtaBlurb: 'Crew me to Western States',
    recentBackers: [
      { name: 'Flagstaff Trail Alliance', when: '1 day ago', amountCents: 30000, icon: 'groups' },
      { name: 'T. Begay', when: '2 days ago', amountCents: 7500, initials: 'TB' },
      { name: 'Anonymous', when: '4 days ago', amountCents: 5000, icon: 'person' },
    ],
    supporterCount: 89,
  },

  'emma-chen': {
    athleteSlug: 'emma-chen',
    handle: '@emma.runs.yvr',
    followers: '812',
    disciplineLabel: 'Road Running · Run-club captain',
    arcSubtitle:
      'From couch-to-5K to a first marathon build — the chapters behind the runner, in her own words.',
    storyIntro:
      'Product designer by day, Tuesday-morning run-club captain by 6 a.m. Two years ago I couldn’t run a kilometre. This May, I’m running my first marathon…',
    storyBody: [
      'Hi, I’m Emma. Two years ago I was burnt out, sleeping badly, and couldn’t run to the end of my block in East Vancouver. A friend sent me a couch-to-5K plan as a joke. I did it out of spite.',
      'My first 5K took 31 minutes and 6 seconds and I cried behind the finish-line tent. Not because it hurt — because I hadn’t known I was allowed to be proud of myself like that.',
      'Then came the Tuesday run club. Then captaining it. Then a 1:47 half marathon that my group chat celebrated like an Olympic final. Nobody on this app needs me to be fast — that’s exactly why I’m here.',
      'This May I’m running the BMO Vancouver Marathon. My first. The plan says 42.2 kilometres; the point is proving that the person from two years ago gets a comeback story too.',
    ],
    personalBests: [
      { label: '5km', value: '23:41' },
      { label: '10km', value: '49:12' },
      { label: 'Half Marathon', value: '1:47:38' },
      { label: 'Longest run', value: '24 km' },
    ],
    careerHighlights: [
      {
        title: '2026 First Half Half Marathon',
        detail: 'First sub-1:50 — 1:47:38 (PB)',
        tone: 'secondary',
        images: ['1530143311094-34d807799e8f', '1452626038306-9aae5e071dd3'],
      },
      {
        title: '2025 Eastside 10K',
        detail: 'Broke 50 minutes — 49:12 (PB)',
        tone: 'primary',
        images: ['1517637633369-e4cc28755e01', '1461897104016-0b3b00cc81ee'],
      },
    ],
    moreResults: [
      {
        title: '2024 My first 5K',
        detail: '31:06 — and completely hooked',
        images: ['1594882645126-14020914d58d', '1490578474895-699cd4e2cf59'],
      },
    ],
    moreResultsLabel: 'See the early days',
    previousRaces: [
      {
        name: 'First Half Half Marathon',
        date: 'Sunday, February 8, 2026',
        result: '1:47:38 (PB) — first sub-1:50',
        tone: 'secondary',
        links: ['Sportstats Results', 'Strava Activity'],
        images: ['1530143311094-34d807799e8f'],
      },
      {
        name: 'Eastside 10K',
        date: 'Saturday, September 13, 2025',
        result: '49:12 (PB) — first sub-50',
        tone: 'primary',
        links: ['Official Results', 'Run club recap post'],
        images: ['1452626038306-9aae5e071dd3'],
      },
      {
        name: 'Fall Classic 10K',
        date: 'Sunday, November 16, 2025',
        result: '50:30 — negative split!',
        tone: 'secondary',
        links: ['Sportstats Results'],
        images: ['1533560904424-a0c61dc306fc', '1483721310020-03333e577078'],
      },
    ],
    morePreviousRaces: [
      {
        name: 'Summerfast 10K',
        date: 'Jul 19, 2025',
        result: '52:44 — first 10K',
        images: ['1490578474895-699cd4e2cf59', '1594882645126-14020914d58d'],
      },
      {
        name: 'My first 5K — Granville Island Turkey Trot',
        date: 'Oct 14, 2024',
        result: '31:06 — cried at the finish',
        images: ['1596727147705-61a532a659bd'],
      },
    ],
    moreRacesLabel: 'See more races (the early days)',
    roadmapTitle: 'The First Marathon',
    roadmap: [
      { name: 'BMO Vancouver Marathon — my first 42.2', date: 'May 3, 2026' },
      { name: 'Summerfast 10K', date: 'July 18, 2026' },
      { name: 'Eastside 10K (sub-48 attempt)', date: 'September 12, 2026' },
    ],
    coreValues: [
      { title: 'Consistency', body: 'Tuesdays, rain or shine.' },
      { title: 'Community', body: 'The club is the point.' },
      { title: 'Joy', body: 'Slow miles still count.' },
      { title: 'Balance', body: 'Design by day, kms by dawn.' },
    ],
    arcChapters: [
      {
        era: '2023',
        title: 'The end of my block',
        icon: 'book',
        tone: 'secondary',
        body: 'Burnt out and sleeping badly, I couldn’t run to the end of my block. A friend sent me a couch-to-5K plan as a joke. I did it out of spite.',
      },
      {
        era: '2024',
        title: 'The first finish line',
        icon: 'heart',
        tone: 'tertiary',
        body: '31:06 at my first 5K — and tears behind the finish-line tent. I hadn’t known I was allowed to be that proud of myself.',
      },
      {
        era: '2024 – 2025',
        title: 'Tuesdays at 6 a.m.',
        icon: 'groups',
        tone: 'primary',
        image: '1490578474895-699cd4e2cf59',
        body: 'I joined the run club for accountability and stayed for the people. Now I captain it — 40 runners, rain or shine, every Tuesday.',
      },
      {
        era: '2026',
        title: 'Sub-1:50',
        icon: 'trophy',
        tone: 'primary',
        body: '1:47:38 at the First Half. My group chat celebrated like it was an Olympic final. In our club, it basically was.',
      },
      {
        era: 'Now',
        title: '42.2',
        icon: 'flag',
        tone: 'primary',
        current: true,
        body: 'The BMO Vancouver Marathon, May 3. My first. Proving the person from two years ago gets a comeback story too.',
      },
    ],
    instagramPosts: [
      { id: '1594882645126-14020914d58d', likes: '84' },
      { id: '1490578474895-699cd4e2cf59', likes: '122' },
      { id: '1483721310020-03333e577078', likes: '96' },
    ],
    training: {
      weeklyKm: '46.3',
      weeklyTime: '4h 25m',
      weeklyGain: '180m',
      latestTitle: 'Run club: Seawall social',
      latestMeta: 'Tuesday • 8.0 km • 48:22',
    },
    galleryPhotos: [
      '1594882645126-14020914d58d',
      '1452626038306-9aae5e071dd3',
      '1530143311094-34d807799e8f',
      '1461897104016-0b3b00cc81ee',
    ],
    supportEnabled: false,
  },
};

export function findAthleteProfile(slug: string): RichAthleteProfile | undefined {
  return athleteProfiles[slug];
}
