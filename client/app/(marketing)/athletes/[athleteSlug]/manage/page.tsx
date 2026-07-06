import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findMockAthlete, mockAthletes } from '@/lib/mockAthletes';
import { ManageProfile } from './ManageProfile';

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
  return { title: athlete ? `Manage — ${athlete.fullName}` : 'Manage profile' };
}

export default async function ManageProfilePage({
  params,
}: {
  params: Promise<{ athleteSlug: string }>;
}) {
  const { athleteSlug } = await params;
  const athlete = findMockAthlete(athleteSlug);
  if (!athlete) notFound();

  return (
    <ManageProfile
      athleteSlug={athlete.athleteSlug}
      athleteName={athlete.fullName}
      initialCoverPhoto={athlete.heroMediaUrl}
    />
  );
}
