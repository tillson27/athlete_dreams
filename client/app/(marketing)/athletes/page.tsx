import type { Metadata } from 'next';
import { listAthletes } from '@/lib/api/athletes';
import { AthleteDirectory } from './AthleteDirectory';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Discover Runners',
  description:
    'Browse verified runners on ARC by discipline, level, and region. Follow the athletes whose journey you want to be part of.',
};

export default async function AthletesIndexPage() {
  const athletes = await listAthletes({ limit: 100 }).catch(() => []);
  return <AthleteDirectory initialAthletes={athletes} />;
}
