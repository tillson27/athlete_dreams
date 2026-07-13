import type { Metadata } from 'next';
import { AthleteDirectory } from './AthleteDirectory';

export const metadata: Metadata = {
  title: 'Discover Runners',
  description:
    'Browse verified runners on ARC by discipline, level, and region. Follow the athletes whose journey you want to be part of.',
};

export default function AthletesIndexPage() {
  return <AthleteDirectory />;
}
