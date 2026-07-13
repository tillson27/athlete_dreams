import { TrendingAthletes } from '@/components/site/TrendingAthletes';
import { HomeHero } from '@/components/site/home/HomeHero';
import { TellYourArcSection } from '@/components/site/home/TellYourArcSection';
import { WhyArcSection } from '@/components/site/home/WhyArcSection';
import { BackingTeaserSection } from '@/components/site/home/BackingTeaserSection';
import { SuccessStoriesSection } from '@/components/site/home/SuccessStoriesSection';
import { HomeCtaSection } from '@/components/site/home/HomeCtaSection';
import { trendingAthletes } from '@/lib/homeContent';

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <TellYourArcSection />
      <TrendingAthletes athletes={trendingAthletes} />
      <WhyArcSection />
      <BackingTeaserSection />
      <SuccessStoriesSection />
      <HomeCtaSection />
    </>
  );
}
