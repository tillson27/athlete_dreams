import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicAthleteProfile } from '@/lib/api/athletes';
import { isApiError } from '@/lib/api/client';
import { formatSport } from '@/lib/format';
import { AthleteProfile } from './AthleteProfile';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ athleteSlug: string }>;
}): Promise<Metadata> {
  const { athleteSlug } = await params;
  const profile = await getPublicAthleteProfile(athleteSlug).catch((error) => {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  });
  if (!profile) return { title: 'Athlete not found' };
  return {
    title: `${profile.fullName} · ${formatSport(profile.primarySport)}`,
    description: profile.headline ?? profile.tagline ?? undefined,
  };
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ athleteSlug: string }>;
}) {
  const { athleteSlug } = await params;
  const profile = await getPublicAthleteProfile(athleteSlug).catch((error) => {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  });
  if (!profile) notFound();

  return <AthleteProfile profile={profile} />;
}
