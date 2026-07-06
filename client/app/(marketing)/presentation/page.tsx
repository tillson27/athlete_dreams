import type { Metadata } from 'next';
import { DeckClient } from './_components/DeckClient';

export const metadata: Metadata = {
  title: 'The ARC Story',
  description: 'ARC — the idea, in slides.',
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
