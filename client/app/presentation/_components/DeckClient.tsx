'use client';

import { DeckView } from './DeckView';
import { appendixSlides, mainSlides, slideSections } from './index';

export function DeckClient() {
  return (
    <DeckView
      mainSlides={mainSlides}
      appendixSlides={appendixSlides}
      sections={slideSections}
    />
  );
}
