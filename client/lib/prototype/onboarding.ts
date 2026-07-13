import { createBrowserStore } from './browserStore';

const onboardingProfileStore = createBrowserStore<unknown>(
  'arc-onboarding-profile',
  'arc-onboarding-profile-change',
);

export function readPrototypeOnboardingProfile<TProfile>(): TProfile | null {
  return onboardingProfileStore.read() as TProfile | null;
}

export function writePrototypeOnboardingProfile<TProfile>(profile: TProfile | null) {
  onboardingProfileStore.write(profile);
}

export function seedPrototypeOnboardingName(name: string) {
  const profile = (onboardingProfileStore.read() as { name?: string } | null) ?? {};
  if (!profile.name) {
    onboardingProfileStore.write({ ...profile, name });
  }
}
