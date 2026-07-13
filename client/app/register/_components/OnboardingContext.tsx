'use client';

import Link from 'next/link';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  AthleteResultKind,
  SportCategory,
  type AthleteProfileDraft,
  type UpsertAthleteProfileDraftRequest,
} from 'fad-common';
import { getMyDraft, upsertMyDraft } from '@/lib/api/athletes';
import { isApiError } from '@/lib/api/client';
import {
  readOnboardingDraftBackup,
  writeOnboardingDraftBackup,
} from '@/lib/onboardingDraftBackup';
import { signOut, useSession } from '@/lib/session';
import { slugifyName } from '@/lib/slugify';
import { Icon } from '@/components/ui/Icon';

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
  draftVersion: number | null;
  saving: boolean;
  saveFailed: boolean;
  update: (patch: OnboardingPatch) => void;
  reset: () => void;
  saveDraft: () => Promise<AthleteProfileDraft | null>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { session, ready } = useSession();
  const [profile, setProfile] = useState<OnboardingProfile>(emptyProfile);
  const [draftVersion, setDraftVersion] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [dirtySequence, setDirtySequence] = useState(0);

  const profileRef = useRef(profile);
  const draftVersionRef = useRef(draftVersion);
  const dirtySequenceRef = useRef(dirtySequence);
  const savedSequenceRef = useRef(0);
  const activeSaveRef = useRef<Promise<AthleteProfileDraft | null> | null>(null);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    draftVersionRef.current = draftVersion;
  }, [draftVersion]);

  useEffect(() => {
    dirtySequenceRef.current = dirtySequence;
  }, [dirtySequence]);

  useEffect(() => {
    if (!ready) return;
    if (!session?.accessToken) {
      setProfile(emptyProfile);
      setDraftVersion(null);
      setHydrated(true);
      return;
    }

    let cancelled = false;
    setHydrated(false);
    setLoadFailed(false);
    setSaveFailed(false);
    savedSequenceRef.current = 0;
    dirtySequenceRef.current = 0;
    setDirtySequence(0);

    getMyDraft(session.accessToken)
      .then((draft) => {
        if (cancelled) return;
        const serverProfile = toOnboardingProfile(draft);
        const pendingBackup = readOnboardingDraftBackup<OnboardingProfile>(
          session.userId,
          draft.profileVersion,
        );
        const initialProfile = pendingBackup ?? serverProfile;
        const initialDirtySequence = pendingBackup ? 1 : 0;

        profileRef.current = initialProfile;
        draftVersionRef.current = draft.profileVersion;
        dirtySequenceRef.current = initialDirtySequence;
        savedSequenceRef.current = 0;
        setProfile(initialProfile);
        setDraftVersion(draft.profileVersion);
        setDirtySequence(initialDirtySequence);
        setHydrated(true);
      })
      .catch((error) => {
        if (cancelled) return;
        if (isApiError(error) && error.status === 401) signOut();
        setLoadFailed(true);
        setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, session?.accessToken, session?.userId]);

  const saveDraft = useCallback(async (): Promise<AthleteProfileDraft | null> => {
    if (activeSaveRef.current) return activeSaveRef.current;

    const runSave = async (): Promise<AthleteProfileDraft | null> => {
      if (!session?.accessToken || !session.userId || draftVersionRef.current === null) {
        return null;
      }

      setSaving(true);
      setSaveFailed(false);
      let latestDraft: AthleteProfileDraft | null = null;

      try {
        while (dirtySequenceRef.current !== savedSequenceRef.current) {
          const sequenceToSave = dirtySequenceRef.current;
          const currentDraftVersion = draftVersionRef.current;
          if (currentDraftVersion === null) return latestDraft;

          latestDraft = await upsertMyDraft(
            session.accessToken,
            toDraftRequest(profileRef.current, currentDraftVersion),
          );
          draftVersionRef.current = latestDraft.profileVersion;
          savedSequenceRef.current = sequenceToSave;
          setDraftVersion(latestDraft.profileVersion);
        }

        writeOnboardingDraftBackup(null);
        return latestDraft;
      } catch (error) {
        if (isApiError(error) && error.status === 401) signOut();
        setSaveFailed(true);
        if (draftVersionRef.current !== null) {
          writeOnboardingDraftBackup({
            userId: session.userId,
            baseProfileVersion: draftVersionRef.current,
            profile: profileRef.current,
          });
        }
        throw error;
      } finally {
        setSaving(false);
      }
    };

    const savePromise = runSave().finally(() => {
      activeSaveRef.current = null;
    });
    activeSaveRef.current = savePromise;
    return savePromise;
  }, [session?.accessToken, session?.userId]);

  useEffect(() => {
    if (!hydrated || !session?.accessToken || draftVersion === null) return;
    if (dirtySequence === savedSequenceRef.current) return;
    const timer = window.setTimeout(() => {
      void saveDraft().catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draftVersion, dirtySequence, hydrated, saveDraft, session?.accessToken]);

  const update = useCallback(
    (patch: OnboardingPatch) => {
      setProfile((current) => {
        const next = {
          ...current,
          ...(typeof patch === 'function' ? patch(current) : patch),
        };
        if (session?.userId && draftVersionRef.current !== null) {
          writeOnboardingDraftBackup({
            userId: session.userId,
            baseProfileVersion: draftVersionRef.current,
            profile: next,
          });
        }
        return next;
      });
      setDirtySequence((current) => current + 1);
    },
    [session?.userId],
  );

  const reset = useCallback(() => {
    setProfile(emptyProfile);
    if (session?.userId && draftVersionRef.current !== null) {
      writeOnboardingDraftBackup({
        userId: session.userId,
        baseProfileVersion: draftVersionRef.current,
        profile: emptyProfile,
      });
    }
    setDirtySequence((current) => current + 1);
  }, [session?.userId]);

  if (!ready || (session && !hydrated)) return <RegisterLoadingState />;
  if (!session) return <RegisterSignedOutGate />;
  if (loadFailed) return <RegisterLoadFailed />;

  return (
    <OnboardingContext.Provider
      value={{
        profile,
        draftVersion,
        saving,
        saveFailed,
        update,
        reset,
        saveDraft,
      }}
    >
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

function toOnboardingProfile(draft: AthleteProfileDraft): OnboardingProfile {
  const highlights = draft.results.filter(
    (result) => result.resultKind === AthleteResultKind.Highlight,
  );
  const races = draft.results.filter((result) => result.resultKind === AthleteResultKind.Race);

  return {
    name: draft.fullName ?? '',
    discipline: draft.disciplineLabel ?? (draft.primarySport === SportCategory.Running ? 'Road running' : ''),
    location: draft.hometown ?? '',
    bio: draft.story.intro ?? draft.story.body.join('\n\n'),
    personalBests: draft.personalBests.map((best) => ({
      id: best.athletePersonalBestId,
      distance: best.label,
      time: best.value,
      resultUrl: best.sourceUrl ?? undefined,
    })),
    careerHighlights: highlights.map((result) => ({
      id: result.athleteResultId,
      title: result.title,
      detail: result.resultText,
      resultUrl: result.sourceLinks[0]?.href,
    })),
    previousRaces: races.map((result) => ({
      id: result.athleteResultId,
      name: result.title,
      result: result.resultText,
      resultUrl: result.sourceLinks[0]?.href,
    })),
    values: draft.values.length ? draft.values : draft.coreValues.map((value) => value.title),
    mission: draft.tagline ?? draft.headline ?? '',
  };
}

function toDraftRequest(
  profile: OnboardingProfile,
  expectedProfileVersion: number,
): UpsertAthleteProfileDraftRequest {
  const fullName = trimToNull(profile.name);
  const tagline = trimToNull(profile.mission);
  const storyIntro = trimToNull(profile.bio);

  return {
    expectedProfileVersion,
    athleteSlug: fullName ? slugOrNull(fullName) : null,
    fullName,
    headline: tagline,
    tagline,
    primarySport: profile.discipline.trim() ? SportCategory.Running : null,
    disciplineLabel: trimToNull(profile.discipline),
    hometown: trimToNull(profile.location),
    values: profile.values,
    coreValues: profile.values.map((value) => ({ title: value, body: '' })),
    story: {
      intro: storyIntro,
      body: [],
    },
    personalBests: profile.personalBests
      .filter((best) => best.distance.trim() && best.time.trim())
      .map((best, sortOrder) => ({
        label: best.distance.trim(),
        value: best.time.trim(),
        sourceUrl: httpUrlOrNull(best.resultUrl),
        sortOrder,
      })),
    results: [
      ...profile.careerHighlights
        .filter((highlight) => highlight.title.trim() && highlight.detail.trim())
        .map((highlight, sortOrder) => ({
          resultKind: AthleteResultKind.Highlight,
          title: highlight.title.trim(),
          resultText: highlight.detail.trim(),
          sourceLinks: sourceLinks(highlight.resultUrl),
          sortOrder,
        })),
      ...profile.previousRaces
        .filter((race) => race.name.trim() && race.result.trim())
        .map((race, index) => ({
          resultKind: AthleteResultKind.Race,
          title: race.name.trim(),
          resultText: race.result.trim(),
          sourceLinks: sourceLinks(race.resultUrl),
          sortOrder: profile.careerHighlights.length + index,
        })),
    ],
  };
}

function trimToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function slugOrNull(value: string): string | null {
  const slug = slugifyName(value);
  return slug.length >= 2 ? slug : null;
}

function httpUrlOrNull(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

function sourceLinks(value?: string): Array<{ label: string; href: string }> | undefined {
  const href = httpUrlOrNull(value);
  return href ? [{ label: 'Results', href }] : undefined;
}

function RegisterLoadingState() {
  return (
    <div className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-12 md:px-16">
      <div className="h-8 w-48 animate-pulse rounded-pill bg-surface-container" />
      <div className="mt-5 grid gap-10 md:grid-cols-2">
        <div className="h-96 animate-pulse rounded-card bg-surface-container" />
        <div className="h-96 animate-pulse rounded-card bg-surface-container" />
      </div>
    </div>
  );
}

function RegisterSignedOutGate() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-16 text-center">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
        <Icon name="lock" className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-on-surface">
          Sign in to build your profile
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Pick up your athlete story where you left off.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/sign-in"
            className="label-bold rounded-lg bg-primary px-6 py-3 text-on-primary transition-all hover:bg-primary-strong"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="label-bold rounded-lg border-2 border-outline px-6 py-3 text-on-surface transition-all hover:bg-surface-container"
          >
            Start your story
          </Link>
        </div>
      </div>
    </main>
  );
}

function RegisterLoadFailed() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-16 text-center">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
        <Icon name="help" className="mx-auto h-10 w-10 text-error" />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-on-surface">
          Draft unavailable
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          We couldn&rsquo;t load your saved profile draft. Try signing in again.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="label-bold mt-6 rounded-lg bg-primary px-6 py-3 text-on-primary transition-all hover:bg-primary-strong"
        >
          Sign in again
        </button>
      </div>
    </main>
  );
}
