'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AthleteProfile } from 'fad-common';
import { createBrowserStore } from '@/lib/browserStore';
import { DATA_SOURCE } from '@/lib/dataSource';
import { useSession } from '@/lib/session';
import {
  loadDraftProfile,
  profileToOnboarding,
  publishDraft,
  saveStep1,
  saveStep2,
  saveStep3,
  toPublishChecklist,
  toSaveErrorSentence,
} from '@/lib/onboardingApi';
import { emptyOnboardingProfile, type OnboardingProfile } from './onboardingProfile';

export type {
  CareerHighlight,
  OnboardingProfile,
  PersonalBest,
  PreviousRace,
} from './onboardingProfile';

// The wizard steps that persist to the API on advance. Step 4 (review) reads the
// draft rather than writing; publish is its own action.
export type OnboardingSaveStep = 1 | 2 | 3;

type OnboardingPatch =
  | Partial<OnboardingProfile>
  | ((current: OnboardingProfile) => Partial<OnboardingProfile>);

// Public API contract: consumers always get `profile` / `update` / `reset` in
// both modes. The remaining fields are the api-mode persistence surface; in mock
// mode `mode === 'mock'`, `saveAndAdvance`/`publish` resolve `true` without a
// network call, and every status field stays inert so page behaviour is
// byte-identical to the prototype.
type OnboardingContextValue = {
  profile: OnboardingProfile;
  update: (patch: OnboardingPatch) => void;
  reset: () => void;
  mode: 'mock' | 'api';
  hydrating: boolean;
  signedOut: boolean;
  canEdit: boolean;
  hasDraft: boolean;
  saving: boolean;
  saveError: string | null;
  clearSaveError: () => void;
  saveAndAdvance: (step: OnboardingSaveStep) => Promise<boolean>;
  publish: () => Promise<boolean>;
  publishChecklist: string[];
  // The reserved slug of the server-side draft (api mode), for the post-publish
  // links; null in mock mode or before the profile is created.
  draftSlug: string | null;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const store = createBrowserStore<Partial<OnboardingProfile>>(
  'arc-onboarding-profile',
  'arc-onboarding-profile-change',
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  if (DATA_SOURCE === 'api') {
    return <ApiOnboardingProvider>{children}</ApiOnboardingProvider>;
  }
  return <MockOnboardingProvider>{children}</MockOnboardingProvider>;
}

// --- Mock mode: today's localStorage-backed flow, unchanged ---

function MockOnboardingProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<OnboardingProfile>(emptyOnboardingProfile);
  const [hydrated, setHydrated] = useState(false);

  // Rehydrate the in-progress profile so it survives step-to-step navigation and reloads.
  useEffect(() => {
    const saved = store.read();
    if (saved) setProfile({ ...emptyOnboardingProfile, ...saved });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    store.write(profile);
  }, [profile, hydrated]);

  const update = makeUpdate(setProfile);
  const reset = () => setProfile(emptyOnboardingProfile);

  return (
    <OnboardingContext.Provider
      value={{
        profile,
        update,
        reset,
        mode: 'mock',
        hydrating: false,
        signedOut: false,
        canEdit: true,
        hasDraft: true,
        saving: false,
        saveError: null,
        clearSaveError: noop,
        saveAndAdvance: resolveTrue,
        publish: resolveTrue,
        publishChecklist: EMPTY_CHECKLIST,
        draftSlug: null,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

// --- API mode: create-on-first-save, PATCH/set-replace per step, real publish ---

function ApiOnboardingProvider({ children }: { children: ReactNode }) {
  const { session, ready } = useSession();
  const signedIn = Boolean(session);
  const [profile, setProfile] = useState<OnboardingProfile>(emptyOnboardingProfile);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishChecklist, setPublishChecklist] = useState<string[]>([]);
  const [draftSlug, setDraftSlug] = useState<string | null>(null);
  // The server-side draft (null until created); tracked so step 1 knows whether
  // to create vs patch and a resumed session keeps the reserved slug.
  const draftRef = useRef<AthleteProfile | null>(null);
  const dirtyRef = useRef(false);

  const rememberDraft = (draft: AthleteProfile) => {
    draftRef.current = draft;
    setDraftSlug(draft.athleteSlug);
  };

  // Hydrate from the caller's existing draft on entry (resume); a 404 starts a
  // fresh wizard. Runs once the session is known so the token is available.
  useEffect(() => {
    if (!ready) return;
    if (!signedIn) {
      setHydrating(false);
      return;
    }
    let active = true;
    setHydrating(true);
    loadDraftProfile()
      .then((draft) => {
        if (!active || !draft) return;
        rememberDraft(draft);
        if (!dirtyRef.current) {
          setProfile(profileToOnboarding(draft));
        }
      })
      .catch(() => {
        // A read failure (network/expired) leaves the wizard fresh; the session
        // listener clears an expired token and the signed-out prompt takes over.
      })
      .finally(() => {
        if (active) setHydrating(false);
      });
    return () => {
      active = false;
    };
    // Re-run only when sign-in state flips, not on every session-object refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signedIn]);

  const update = (patch: OnboardingPatch) => {
    dirtyRef.current = true;
    makeUpdate(setProfile)(patch);
  };
  const reset = () => setProfile(emptyOnboardingProfile);
  const clearSaveError = () => setSaveError(null);

  const saveAndAdvance = async (step: OnboardingSaveStep): Promise<boolean> => {
    if (!ready || !signedIn || hydrating) {
      setSaveError('Sign in to save your progress.');
      return false;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (step === 1) {
        rememberDraft(await saveStep1(profile, draftRef.current));
        dirtyRef.current = false;
      } else if (step === 2) {
        rememberDraft(await saveStep2(profile));
        dirtyRef.current = false;
      } else {
        rememberDraft(await saveStep3(profile));
        dirtyRef.current = false;
      }
      return true;
    } catch (error) {
      setSaveError(toSaveErrorSentence(error));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async (): Promise<boolean> => {
    if (!ready || !signedIn || hydrating) {
      setSaveError('Sign in to publish your profile.');
      return false;
    }
    setSaving(true);
    setSaveError(null);
    setPublishChecklist(EMPTY_CHECKLIST);
    try {
      await publishDraft();
      return true;
    } catch (error) {
      const checklist = toPublishChecklist(detailsOf(error));
      if (checklist.length > 0) {
        setPublishChecklist(checklist);
      } else {
        setSaveError(toSaveErrorSentence(error));
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        profile,
        update,
        reset,
        mode: 'api',
        hydrating: !ready || hydrating,
        signedOut: ready && !signedIn,
        canEdit: ready && signedIn && !hydrating,
        hasDraft: Boolean(draftSlug),
        saving,
        saveError,
        clearSaveError,
        saveAndAdvance,
        publish,
        publishChecklist,
        draftSlug,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

// Accepts a functional patch so rapid successive updates never read stale state.
function makeUpdate(setProfile: (updater: (current: OnboardingProfile) => OnboardingProfile) => void) {
  return (patch: OnboardingPatch) =>
    setProfile((current) => ({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    }));
}

function detailsOf(error: unknown): unknown {
  return error !== null && typeof error === 'object' && 'details' in error
    ? (error as { details: unknown }).details
    : null;
}

const EMPTY_CHECKLIST: string[] = [];
const noop = () => {};
const resolveTrue = async () => true;

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
