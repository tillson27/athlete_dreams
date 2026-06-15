import type { Metadata } from 'next';
import { DeckClient } from './_components/DeckClient';

export const metadata: Metadata = {
  title: 'Investor Brief',
  description: 'FAD Network investor brief — confidential.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function PresentationPage() {
  return <DeckClient />;
}
