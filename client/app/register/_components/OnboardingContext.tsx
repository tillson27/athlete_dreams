'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createBrowserStore } from '@/lib/browserStore';

export type PersonalBest = { id: string; distance: string; time: string; resultUrl?: string };
export type CareerHighlight = { id: string; title: string; detail: string; resultUrl?: string };
export type PreviousRace = { id: string; name: string; result: string; resultUrl?: string };

export type OnboardingProfile = {
  name: string;
  discipline: string;
  location: string;
  bio: string;
  personalBests: PersonalBest[];
  careerHighlights: CareerHighlight[];
  previousRaces: PreviousRace[];
  values: string[];
  mission: string;
};

const emptyProfile: OnboardingProfile = {
  name: '',
  discipline: '',
  location: '',
  bio: '',
  personalBests: [],
  careerHighlights: [],
  previousRaces: [],
  values: [],
  mission: '',
};

type OnboardingPatch =
  | Partial<OnboardingProfile>
  | ((current: OnboardingProfile) => Partial<OnboardingProfile>);

type OnboardingContextValue = {
  profile: OnboardingProfile;
  update: (patch: OnboardingPatch) => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const store = createBrowserStore<Partial<OnboardingProfile>>(
  'arc-onboarding-profile',
  'arc-onboarding-profile-change',
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<OnboardingProfile>(emptyProfile);
  const [hydrated, setHydrated] = useState(false);

  // Rehydrate the in-progress profile so it survives step-to-step navigation and reloads.
  useEffect(() => {
    const saved = store.read();
    if (saved) setProfile({ ...emptyProfile, ...saved });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    store.write(profile);
  }, [profile, hydrated]);

  // Accepts a functional patch so rapid successive updates never read stale state.
  const update = (patch: OnboardingPatch) =>
    setProfile((current) => ({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    }));
  const reset = () => setProfile(emptyProfile);

  return (
    <OnboardingContext.Provider value={{ profile, update, reset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
