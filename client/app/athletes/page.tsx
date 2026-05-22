import type { Metadata } from 'next';
import { AthleteDirectory } from './AthleteDirectory';

export const metadata: Metadata = {
  title: 'Athlete Directory',
  description:
    'Browse the FAD directory by sport, region, and funding stage. Find the athlete you want to back.',
};

export default function AthletesIndexPage() {
  return <AthleteDirectory />;
}
