import type { Metadata } from 'next';
import { AthleteDirectory } from './AthleteDirectory';

export const metadata: Metadata = {
  title: 'Discover athletes',
  description:
    'Browse the FAD directory by sport, hometown, and value. Find the athlete you want to back.',
};

export default function AthletesIndexPage() {
  return (
    <AthleteDirectory />
  );
}
