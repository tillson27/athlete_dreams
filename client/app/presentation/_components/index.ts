export type { Slide, SlideSectionKey } from './_shell';
export { slideSections } from './_shell';

import type { Slide } from './_shell';

import { coverSlide } from './main/cover';
import { problemSlide } from './main/problem';
import { solutionSlide } from './main/solution';
import { transparencySlide } from './main/transparency';
import { verifiedStandardSlide } from './main/verified-standard';
import { crowdfundingReimaginedSlide } from './main/crowdfunding-reimagined';
import { patronLadderSlide } from './main/patron-ladder';
import { marketSlide } from './main/market';
import { tractionSlide } from './main/traction';
import { visionSlide } from './main/vision';
import { teamSlide } from './main/team';
import { askSlide } from './main/ask';
import { thankYouSlide } from './main/thank-you';

import { a00Divider } from './appendix/a00-divider';
import { a01UnitEconomics } from './appendix/a01-unit-economics';
import { a02Competition } from './appendix/a02-competition';
import { a03Sources } from './appendix/a03-sources';

export const mainSlides: ReadonlyArray<Slide> = [
  coverSlide,
  problemSlide,
  solutionSlide,
  transparencySlide,
  verifiedStandardSlide,
  crowdfundingReimaginedSlide,
  patronLadderSlide,
  marketSlide,
  tractionSlide,
  visionSlide,
  teamSlide,
  askSlide,
  thankYouSlide,
];

export const appendixSlides: ReadonlyArray<Slide> = [
  a00Divider,
  a01UnitEconomics,
  a02Competition,
  a03Sources,
];
