'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type PersonalBest = { id: string; distance: string; time: string };

export type OnboardingProfile = {
  name: string;
  discipline: string;
  location: string;
  bio: string;
  personalBests: PersonalBest[];
  values: string[];
  mission: string;
};

const emptyProfile: OnboardingProfile = {
  name: '',
  discipline: '',
  location: '',
  bio: '',
  personalBests: [],
  values: [],
  mission: '',
};

type OnboardingContextValue = {
  profile: OnboardingProfile;
  update: (patch: Partial<OnboardingProfile>) => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const STORAGE_KEY = 'arc-onboarding-profile';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<OnboardingProfile>(emptyProfile);
  const [hydrated, setHydrated] = useState(false);

  // Rehydrate the in-progress profile so it survives step-to-step navigation and reloads.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile({ ...emptyProfile, ...JSON.parse(raw) });
    } catch {
      /* storage unavailable — start fresh */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* storage unavailable — skip persistence */
    }
  }, [profile, hydrated]);

  const update = (patch: Partial<OnboardingProfile>) =>
    setProfile((current) => ({ ...current, ...patch }));
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
