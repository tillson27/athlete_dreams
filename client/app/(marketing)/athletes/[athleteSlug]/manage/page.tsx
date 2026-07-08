import type { Metadata } from 'next';
import { findMockAthlete, mockAthletes } from '@/lib/mockAthletes';
import { unsplashPhoto } from '@/lib/unsplash';
import { ManageProfile } from './ManageProfile';

const FALLBACK_COVER = unsplashPhoto('1594882645126-14020914d58d', 1400);

// New athletes' slugs aren't in the mock roster yet — derive a display name so
// their editor still works instead of dead-ending on a 404.
function nameFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function generateStaticParams() {
  return mockAthletes.map((athlete) => ({ athleteSlug: athlete.athleteSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ athleteSlug: string }>;
}): Promise<Metadata> {
  const { athleteSlug } = await params;
  const athlete = findMockAthlete(athleteSlug);
  return { title: `Manage — ${athlete?.fullName ?? nameFromSlug(athleteSlug)}` };
}

export default async function ManageProfilePage({
  params,
}: {
  params: Promise<{ athleteSlug: string }>;
}) {
  const { athleteSlug } = await params;
  const athlete = findMockAthlete(athleteSlug);

  return (
    <ManageProfile
      athleteSlug={athleteSlug}
      athleteName={athlete?.fullName ?? nameFromSlug(athleteSlug)}
      initialCoverPhoto={athlete?.heroMediaUrl ?? FALLBACK_COVER}
    />
  );
}
