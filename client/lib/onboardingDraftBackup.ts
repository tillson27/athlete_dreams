import { createBrowserStore } from './browserStore';

export type OnboardingDraftBackup<TProfile> = {
  userId: string;
  baseProfileVersion: number;
  profile: TProfile;
};

const onboardingDraftBackupStore = createBrowserStore<OnboardingDraftBackup<unknown>>(
  'arc-onboarding-draft-backup',
  'arc-onboarding-draft-backup-change',
);

export function readOnboardingDraftBackup<TProfile>(
  userId: string,
  profileVersion: number,
): TProfile | null {
  const backup = onboardingDraftBackupStore.read();
  if (!backup) return null;
  if (backup.userId !== userId) return null;
  if (backup.baseProfileVersion !== profileVersion) return null;
  return backup.profile as TProfile;
}

export function writeOnboardingDraftBackup<TProfile>(
  backup: OnboardingDraftBackup<TProfile> | null,
): void {
  onboardingDraftBackupStore.write(backup);
}
