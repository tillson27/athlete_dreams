import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findMockAthlete, mockAthletes } from '@/lib/mockAthletes';
import { findAthleteProfile } from '@/lib/athleteProfiles';
import { formatSport } from '@/lib/format';
import { AthleteProfile } from './AthleteProfile';

export async function generateStaticParams() {
  return mockAthletes.map((athlete) => ({ athleteSlug: athlete.athleteSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ athleteSlug: string }>;
}): Promise<Metadata> {
  const { athleteSlug } = await params;
  const athlete = findMockAthlete(athleteSlug);
  if (!athlete) return { title: 'Athlete not found' };
  return {
    title: `${athlete.fullName} · ${formatSport(athlete.primarySport)}`,
    description: athlete.headline,
  };
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ athleteSlug: string }>;
}) {
  const { athleteSlug } = await params;
  const athlete = findMockAthlete(athleteSlug);
  const profile = findAthleteProfile(athleteSlug);
  if (!athlete || !profile) notFound();

  return <AthleteProfile athlete={athlete} profile={profile} />;
}
