// Shared onboarding view-model types. Kept framework-free (no React, no
// 'use client') so both the client context (OnboardingContext) and the pure
// persistence layer (client/lib/onboardingApi.ts) can import them without
// pulling the client boundary into the lib.

export type PersonalBest = { id: string; distance: string; time: string; resultUrl?: string };
export type CareerHighlight = { id: string; title: string; detail: string; resultUrl?: string };
export type PreviousRace = { id: string; name: string; result: string; resultUrl?: string };

export type OnboardingProfile = {
  name: string;
  location: string;
  bio: string;
  personalBests: PersonalBest[];
  careerHighlights: CareerHighlight[];
  previousRaces: PreviousRace[];
  values: string[];
  mission: string;
};

export const emptyOnboardingProfile: OnboardingProfile = {
  name: '',
  location: '',
  bio: '',
  personalBests: [],
  careerHighlights: [],
  previousRaces: [],
  values: [],
  mission: '',
};
