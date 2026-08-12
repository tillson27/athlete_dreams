'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SortableList, type SortableItemRenderProps } from '@/components/ui/SortableList';
import { findAthleteProfile } from '@/lib/athleteProfiles';
import { DATA_SOURCE } from '@/lib/dataSource';
import { useSession } from '@/lib/session';
import { athleteProfileHref } from '@/lib/profileUrl';
import {
  deriveEdits,
  loadEdits,
  saveEdits,
  clearEdits,
  type AthleteEdits,
  type EditCoreValue as CoreValue,
  type EditHighlight as Highlight,
  type EditPersonalBest as PersonalBest,
  type EditRace as Race,
  type EditRoadmapItem as RoadmapItem,
} from '@/lib/athleteEdits';
import { fetchMyProfile } from '@/lib/api';
import { ConnectStripeCard } from './ConnectStripeCard';
import { profileToEdits, saveEditsToApi, toManageSaveError } from '@/lib/manageApi';
import {
  COVER_IMAGE_OPTIONS,
  IMAGE_UPLOAD_ACCEPT,
  PROFILE_IMAGE_OPTIONS,
  filesToPersistedImageRefs,
  toImageUploadErrorMessage,
} from '@/lib/imageUploads';
import { uid } from '@/lib/uid';

const inputClass =
  'w-full rounded-input border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/25';

const EMPTY_EDITS: AthleteEdits = {
  storyIntro: '',
  storyBody: '',
  personalBests: [],
  coreValues: [],
  highlights: [],
  races: [],
  roadmap: [],
  gallery: [],
};

type ConfirmRequest = {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
};

function toSaveSnapshot(edits: AthleteEdits, coverPhoto: string): string {
  return JSON.stringify({ edits, coverPhoto });
}

// Swap an item with its neighbour to move it up (-1) or down (+1) the list.
function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// Mode seam. Mock mode (static preview / prototype) seeds from the published
// athleteProfiles data and auto-saves edits to `arc-manage-<slug>` localStorage.
// Api mode loads the owner's four editable sets from `GET /v1/athletes/me` and
// saves them via the set-replace PUTs, gated to the signed-in owner of the slug.
export function ManageProfile({
  athleteSlug,
  athleteName,
  initialCoverPhoto,
}: {
  athleteSlug: string;
  athleteName: string;
  initialCoverPhoto: string;
}) {
  if (DATA_SOURCE === 'api') {
    return <ManageProfileApi athleteSlug={athleteSlug} initialCoverPhoto={initialCoverPhoto} />;
  }
  return (
    <ManageProfileMock
      athleteSlug={athleteSlug}
      athleteName={athleteName}
      initialCoverPhoto={initialCoverPhoto}
    />
  );
}

// --- Mock mode: today's localStorage-backed editor, unchanged ---

function ManageProfileMock({
  athleteSlug,
  athleteName,
  initialCoverPhoto,
}: {
  athleteSlug: string;
  athleteName: string;
  initialCoverPhoto: string;
}) {
  // Seed from the athlete's published profile, then hydrate any saved edits.
  const published = useMemo<AthleteEdits>(() => {
    const profile = findAthleteProfile(athleteSlug);
    return profile ? deriveEdits(profile) : EMPTY_EDITS;
  }, [athleteSlug]);

  const [edits, setEdits] = useState<AthleteEdits>(published);
  const [coverPhoto, setCoverPhoto] = useState<string>(initialCoverPhoto);
  const [hydrated, setHydrated] = useState(false);

  // Load any previously saved edits for this athlete (client-only, avoids SSR mismatch).
  useEffect(() => {
    const saved = loadEdits(athleteSlug);
    if (saved) {
      setEdits(saved);
      if (saved.coverPhoto) setCoverPhoto(saved.coverPhoto);
    }
    setHydrated(true);
  }, [athleteSlug]);

  // Persist edits whenever they change, once hydration has settled.
  useEffect(() => {
    if (!hydrated) return;
    saveEdits(athleteSlug, { ...edits, coverPhoto });
  }, [hydrated, athleteSlug, edits, coverPhoto]);

  const resetToPublished = () => {
    clearEdits(athleteSlug);
    setEdits(published);
    setCoverPhoto(initialCoverPhoto);
  };

  return (
    <EditorLayout
      athleteName={athleteName}
      publicHref={athleteProfileHref(athleteSlug)}
      edits={edits}
      setEdits={setEdits}
      coverPhoto={coverPhoto}
      setCoverPhoto={setCoverPhoto}
      headerActions={<ResetButton onClick={resetToPublished} label="Reset to published" />}
      footerActions={null}
      footer={
        <p className="text-xs text-on-surface-variant">
          Changes save to this browser and appear on your public profile.
        </p>
      }
    />
  );
}

// --- Api mode: load from GET /v1/athletes/me, Save via set-replace PUTs ---

type ApiEditorState =
  | { kind: 'loading' }
  | { kind: 'signed-out' }
  | { kind: 'not-owner'; ownerSlug: string | null }
  | { kind: 'load-error' }
  | {
      kind: 'ready';
      athleteSlug: string;
      athleteName: string;
      edits: AthleteEdits;
      coverPhoto: string;
    };

// `/athletes/me/manage` is the slug-free alias for "my own page". Stripe's
// account-link return/refresh URLs are configured once per environment and
// cannot carry a per-athlete slug, so they land here.
const OWN_PROFILE_SLUG_ALIAS = 'me';

function ManageProfileApi({
  athleteSlug,
  initialCoverPhoto,
}: {
  athleteSlug: string;
  initialCoverPhoto: string;
}) {
  const { session, ready } = useSession();
  const signedIn = Boolean(session);
  const [state, setState] = useState<ApiEditorState>({ kind: 'loading' });

  // Resolve ownership and the seed edits from the caller's own profile. The
  // editor is owner-only: the set-replace PUTs always target the caller's own
  // profile, so a non-owner (or anonymous visitor) can never edit this slug.
  useEffect(() => {
    if (!ready) return;
    if (!signedIn) {
      setState({ kind: 'signed-out' });
      return;
    }
    let active = true;
    setState({ kind: 'loading' });
    fetchMyProfile()
      .then((profile) => {
        if (!active) return;
        const isOwnPage =
          athleteSlug === OWN_PROFILE_SLUG_ALIAS || profile.athleteSlug === athleteSlug;
        if (!isOwnPage) {
          setState({ kind: 'not-owner', ownerSlug: profile.athleteSlug });
          return;
        }
        setState({
          kind: 'ready',
          athleteSlug: profile.athleteSlug,
          athleteName: profile.fullName,
          edits: profileToEdits(profile),
          coverPhoto: profile.heroMediaUrl ?? initialCoverPhoto,
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        // A 404 means the signed-in user has no profile at all — they cannot own
        // this slug, so route them like any other non-owner.
        setState(isNotFound(error) ? { kind: 'not-owner', ownerSlug: null } : { kind: 'load-error' });
      });
    return () => {
      active = false;
    };
    // Re-run only when sign-in state, the routed slug, or the fallback cover changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signedIn, athleteSlug, initialCoverPhoto]);

  if (state.kind === 'loading') return <EditorLoading />;
  if (state.kind === 'signed-out') return <EditorGate variant="signed-out" athleteSlug={athleteSlug} />;
  if (state.kind === 'not-owner')
    return <EditorGate variant="not-owner" athleteSlug={athleteSlug} ownerSlug={state.ownerSlug} />;
  if (state.kind === 'load-error') return <EditorGate variant="error" athleteSlug={athleteSlug} />;

  return (
    <ApiEditorReady
      athleteSlug={state.athleteSlug}
      athleteName={state.athleteName}
      initialCoverPhoto={state.coverPhoto}
      initialEdits={state.edits}
    />
  );
}

function ApiEditorReady({
  athleteSlug,
  athleteName,
  initialCoverPhoto,
  initialEdits,
}: {
  athleteSlug: string;
  athleteName: string;
  initialCoverPhoto: string;
  initialEdits: AthleteEdits;
}) {
  const [edits, setEdits] = useState<AthleteEdits>(initialEdits);
  const [coverPhoto, setCoverPhoto] = useState<string>(initialCoverPhoto);
  const [coverDirty, setCoverDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [recentlySaved, setRecentlySaved] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const savedSnapshotRef = useRef(toSaveSnapshot(initialEdits, initialCoverPhoto));
  const editsRef = useRef(edits);
  const coverPhotoRef = useRef(coverPhoto);
  const coverDirtyRef = useRef(coverDirty);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedConfirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipInitialAutosaveRef = useRef(true);
  const saveRequestIdRef = useRef(0);
  const savingRef = useRef(false);
  const queuedSaveRef = useRef(false);
  const saveRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    editsRef.current = edits;
    coverPhotoRef.current = coverPhoto;
    coverDirtyRef.current = coverDirty;
  }, [edits, coverPhoto, coverDirty]);

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, []);

  const clearSavedConfirmationTimer = useCallback(() => {
    if (savedConfirmationTimerRef.current) {
      clearTimeout(savedConfirmationTimerRef.current);
      savedConfirmationTimerRef.current = null;
    }
  }, []);

  const acknowledgeSaved = useCallback(() => {
    clearSavedConfirmationTimer();
    setLastSavedAt(new Date());
    setRecentlySaved(true);
    savedConfirmationTimerRef.current = setTimeout(() => {
      setRecentlySaved(false);
      savedConfirmationTimerRef.current = null;
    }, 5000);
  }, [clearSavedConfirmationTimer]);

  const save = useCallback(async () => {
    clearAutosaveTimer();
    const currentEdits = editsRef.current;
    const currentCoverPhoto = coverPhotoRef.current;
    const attemptedSnapshot = toSaveSnapshot(currentEdits, currentCoverPhoto);
    if (attemptedSnapshot === savedSnapshotRef.current) {
      setSaveError(null);
      return;
    }
    if (savingRef.current) {
      queuedSaveRef.current = true;
      return;
    }
    const saveRequestId = ++saveRequestIdRef.current;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    setRecentlySaved(false);
    clearSavedConfirmationTimer();
    try {
      await saveEditsToApi(currentEdits, coverDirtyRef.current ? currentCoverPhoto : undefined);
      if (saveRequestId !== saveRequestIdRef.current) return;
      savedSnapshotRef.current = attemptedSnapshot;
      if (toSaveSnapshot(editsRef.current, coverPhotoRef.current) === attemptedSnapshot) {
        setCoverDirty(false);
        acknowledgeSaved();
      }
    } catch (error) {
      if (
        saveRequestId === saveRequestIdRef.current &&
        toSaveSnapshot(editsRef.current, coverPhotoRef.current) === attemptedSnapshot
      ) {
        setSaveError(toManageSaveError(error));
      }
    } finally {
      savingRef.current = false;
      if (saveRequestId === saveRequestIdRef.current) {
        setSaving(false);
      }
      if (queuedSaveRef.current) {
        queuedSaveRef.current = false;
        if (toSaveSnapshot(editsRef.current, coverPhotoRef.current) !== savedSnapshotRef.current) {
          setTimeout(() => {
            void saveRef.current?.();
          }, 0);
        }
      }
    }
  }, [acknowledgeSaved, clearAutosaveTimer, clearSavedConfirmationTimer]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (skipInitialAutosaveRef.current) {
      skipInitialAutosaveRef.current = false;
      return;
    }
    clearAutosaveTimer();
    autosaveTimerRef.current = setTimeout(() => {
      void save();
    }, 1000);
    return clearAutosaveTimer;
  }, [edits, coverPhoto, clearAutosaveTimer, save]);

  useEffect(
    () => () => {
      saveRequestIdRef.current += 1;
      savingRef.current = false;
      queuedSaveRef.current = false;
      clearAutosaveTimer();
      clearSavedConfirmationTimer();
    },
    [clearAutosaveTimer, clearSavedConfirmationTimer]
  );

  const lastSavedCopy = lastSavedAt
    ? `Last saved at ${lastSavedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`
    : null;

  const renderSaveButton = () => (
    <SaveButton onClick={save} saving={saving} />
  );

  // Any edit invalidates the "Saved" acknowledgement so it never lingers stale.
  const setEditsAndClearSaved = (
    updater: AthleteEdits | ((current: AthleteEdits) => AthleteEdits)
  ) => {
    setRecentlySaved(false);
    setSaveError(null);
    setEdits(updater);
  };

  return (
    <EditorLayout
      athleteName={athleteName}
      publicHref={athleteProfileHref(athleteSlug)}
      edits={edits}
      setEdits={setEditsAndClearSaved}
      coverPhoto={coverPhoto}
      setCoverPhoto={(url) => {
        setRecentlySaved(false);
        setSaveError(null);
        setCoverDirty(true);
        setCoverPhoto(url);
      }}
      topSlot={<ConnectStripeCard />}
      headerActions={renderSaveButton()}
      footerActions={renderSaveButton()}
      footer={
        <div className="text-xs">
          {saveError ? (
            <p className="text-error">{saveError}</p>
          ) : saving ? (
            <p className="text-on-surface-variant">Saving…</p>
          ) : recentlySaved ? (
            <p className="text-success">Saved. Your public profile is up to date.</p>
          ) : lastSavedCopy ? (
            <p className="text-on-surface-variant">{lastSavedCopy}</p>
          ) : (
            <p className="text-on-surface-variant">
              Changes autosave to your profile. Save now to force an update.
            </p>
          )}
        </div>
      }
    />
  );
}

function isNotFound(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    (error as { status: unknown }).status === 404
  );
}

// --- Shared editor layout (identical body for both modes) ---

function EditorLayout({
  athleteName,
  publicHref,
  edits,
  setEdits,
  coverPhoto,
  setCoverPhoto,
  headerActions,
  footerActions,
  topSlot,
  footer,
}: {
  athleteName: string;
  publicHref: string;
  edits: AthleteEdits;
  setEdits: (updater: AthleteEdits | ((current: AthleteEdits) => AthleteEdits)) => void;
  coverPhoto: string;
  setCoverPhoto: (url: string) => void;
  headerActions: ReactNode;
  footerActions: ReactNode;
  topSlot?: ReactNode;
  footer: ReactNode;
}) {
  const { storyIntro, storyBody, personalBests, coreValues, highlights, races, roadmap, gallery } =
    edits;
  const setStoryIntro = (value: string) =>
    setEdits((current) => ({ ...current, storyIntro: value }));
  const setStoryBody = (value: string) => setEdits((current) => ({ ...current, storyBody: value }));
  const setPersonalBests = (updater: (prev: PersonalBest[]) => PersonalBest[]) =>
    setEdits((current) => ({ ...current, personalBests: updater(current.personalBests) }));
  const setCoreValues = (updater: (prev: CoreValue[]) => CoreValue[]) =>
    setEdits((current) => ({ ...current, coreValues: updater(current.coreValues) }));
  const setHighlights = (updater: (prev: Highlight[]) => Highlight[]) =>
    setEdits((current) => ({ ...current, highlights: updater(current.highlights) }));
  const setRaces = (updater: (prev: Race[]) => Race[]) =>
    setEdits((current) => ({ ...current, races: updater(current.races) }));
  const setRoadmap = (updater: (prev: RoadmapItem[]) => RoadmapItem[]) =>
    setEdits((current) => ({ ...current, roadmap: updater(current.roadmap) }));
  const setGallery = (updater: (prev: string[]) => string[]) =>
    setEdits((current) => ({ ...current, gallery: updater(current.gallery) }));

  // Staged photos for the two "add" forms (previewed before the row is added).
  const [highlightPhotos, setHighlightPhotos] = useState<string[]>([]);
  const [racePhotos, setRacePhotos] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  const prepareImages = (
    files: FileList | File[],
    options: typeof COVER_IMAGE_OPTIONS,
    onReady: (refs: string[]) => void
  ) => {
    setUploadError(null);
    void filesToPersistedImageRefs(files, options)
      .then(onReady)
      .catch((error: unknown) => setUploadError(toImageUploadErrorMessage(error)));
  };

  const addHighlight = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get('title') ?? '').trim();
    const detail = String(data.get('detail') ?? '').trim();
    if (!title || !detail) return;
    setHighlights((prev) => [
      ...prev,
      {
        id: uid(),
        title,
        detail,
        date: String(data.get('date') ?? '').trim() || undefined,
        resultsUrl: String(data.get('resultsUrl') ?? '').trim() || undefined,
        photos: highlightPhotos,
      },
    ]);
    form.reset();
    setHighlightPhotos([]);
  };

  const addRace = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const date = String(data.get('date') ?? '').trim();
    const result = String(data.get('result') ?? '').trim();
    if (!name || !date || !result) return;
    setRaces((prev) => [
      ...prev,
      {
        id: uid(),
        name,
        date,
        result,
        resultsUrl: String(data.get('resultsUrl') ?? '').trim() || undefined,
        photos: racePhotos,
      },
    ]);
    form.reset();
    setRacePhotos([]);
  };

  const addRoadmap = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const date = String(data.get('date') ?? '').trim();
    if (!name || !date) return;
    setRoadmap((prev) => [...prev, { id: uid(), name, date }]);
    form.reset();
  };

  const handleConfirm = () => {
    const onConfirm = confirmRequest?.onConfirm;
    setConfirmRequest(null);
    onConfirm?.();
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12 md:px-16">
      {/* Header */}
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-secondary-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.05em] text-secondary">
            <Icon name="pencil" className="h-3.5 w-3.5" />
            Athlete view
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            Manage your page
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Add races and achievements to {athleteName}&rsquo;s profile.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Link
            href="/dashboard"
            className="label-bold inline-flex min-h-11 items-center gap-2 rounded-pill border border-outline-variant px-4 py-2 text-on-surface transition-colors hover:bg-surface-container"
          >
            <Icon name="arrow-back" className="h-4 w-4" />
            Dashboard
          </Link>
          {headerActions}
          <a
            href={publicHref}
            className="label-bold inline-flex min-h-11 items-center gap-2 rounded-pill border border-outline-variant px-4 py-2 text-on-surface transition-colors hover:bg-surface-container"
          >
            View public page
            <Icon name="external" className="h-4 w-4" />
          </a>
        </div>
      </div>

      {topSlot ? <div className="mb-6">{topSlot}</div> : null}

      <div className="space-y-6">
        {/* Your story */}
        <SectionCard icon="book" title="Your Story" count={storyBody.trim() ? 1 : 0}>
          <div className="space-y-5">
            <div>
              <label className="label-bold mb-2 block text-on-surface" htmlFor="story-intro">
                Tagline
              </label>
              <input
                id="story-intro"
                value={storyIntro}
                onChange={(event) => setStoryIntro(event.target.value)}
                placeholder="One line your profile leads with — e.g. Marathoner chasing a sub-2:30 in Tokyo"
                className={inputClass}
              />
            </div>
            <div>
              <label className="label-bold mb-2 block text-on-surface" htmlFor="story-body">
                Your story
              </label>
              <textarea
                id="story-body"
                rows={10}
                value={storyBody}
                onChange={(event) => setStoryBody(event.target.value)}
                placeholder="What got you started? What are you chasing? Write it in your own voice."
                className={inputClass}
              />
              <Recommendation text="Leave a blank line between paragraphs — each block becomes its own paragraph in the My Story section on your public profile." />
            </div>
          </div>
        </SectionCard>

        {/* Photos */}
        <SectionCard icon="camera" title="Photos" count={gallery.length + 1}>
          {uploadError ? (
            <p role="alert" className="mb-4 rounded-input bg-error/10 px-4 py-3 text-sm font-semibold text-error">
              {uploadError}
            </p>
          ) : null}
          {/* Cover photo */}
          <div className="mb-6">
            <p className="label-bold mb-2 text-on-surface">Cover photo</p>
            <div className="relative aspect-video w-full overflow-hidden rounded-input bg-surface-container">
              <Image
                src={coverPhoto}
                alt="Cover photo"
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 700px"
                className="object-cover"
              />
              <label className="absolute bottom-3 right-3 inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-black/60 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-black/80">
                <input
                  type="file"
                  accept={IMAGE_UPLOAD_ACCEPT}
                  className="hidden"
                  onChange={(event) => {
                    const files = event.target.files;
                    if (files?.length) {
                      prepareImages(files, COVER_IMAGE_OPTIONS, ([cover]) => {
                        if (cover) setCoverPhoto(cover);
                      });
                    }
                    event.target.value = '';
                  }}
                />
                <Icon name="camera" className="h-3.5 w-3.5" />
                Replace cover
              </label>
            </div>
            <Recommendation text="Best on the app: a wide landscape shot, 16:9, at least 1920 × 1080 px, under 5 MB. JPG, PNG, WebP, and iPhone HEIC photos all work. It fills the full-width hero banner, so keep faces and key action near the centre." />
          </div>

          {/* Gallery */}
          <div>
            <p className="label-bold mb-2 text-on-surface">Gallery</p>
            <div className="flex flex-wrap gap-3">
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-input border-2 border-dashed border-outline-variant/60 bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary hover:text-primary">
                <input
                  type="file"
                  accept={IMAGE_UPLOAD_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files?.length) {
                      prepareImages(event.target.files, PROFILE_IMAGE_OPTIONS, (refs) => {
                        setGallery((prev) => [...prev, ...refs]);
                      });
                    }
                    event.target.value = '';
                  }}
                />
                <Icon name="plus" className="h-5 w-5" />
                <span className="mt-1 text-[10px] font-bold">Add photos</span>
              </label>
              {gallery.map((url, index) => (
                <div key={url} className="relative h-24 w-24 overflow-hidden rounded-input">
                  <Image src={url} alt={`Gallery photo ${index + 1}`} fill unoptimized sizes="96px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setGallery((prev) => prev.filter((entry) => entry !== url))}
                    aria-label="Remove photo"
                    className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end rounded-input p-1 text-white"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 transition-colors hover:bg-black/80">
                      <Icon name="close" className="h-3 w-3" />
                    </span>
                  </button>
                </div>
              ))}
            </div>
            <Recommendation text="Gallery photos display as squares — upload 1:1 crops at least 800 × 800 px so they stay sharp on high-resolution screens." />
          </div>
        </SectionCard>

        {/* Personal Bests */}
        <SectionCard icon="timer" title="Personal Bests" count={personalBests.length}>
          {personalBests.length > 0 ? (
            <div className="space-y-3">
              {personalBests.map((best) => (
                <div
                  key={best.id}
                  className="space-y-3 rounded-input border border-outline-variant bg-surface-container-low p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid flex-1 gap-3 md:grid-cols-2">
                      <input
                        aria-label="Distance or event"
                        value={best.label}
                        onChange={(event) =>
                          setPersonalBests((prev) =>
                            prev.map((entry) =>
                              entry.id === best.id ? { ...entry, label: event.target.value } : entry
                            )
                          )
                        }
                        placeholder="Distance (e.g. Marathon)"
                        className={inputClass}
                      />
                      <input
                        aria-label="Time"
                        value={best.value}
                        onChange={(event) =>
                          setPersonalBests((prev) =>
                            prev.map((entry) =>
                              entry.id === best.id ? { ...entry, value: event.target.value } : entry
                            )
                          )
                        }
                        placeholder="Time (e.g. 2:34:11)"
                        className={inputClass}
                      />
                    </div>
                    <DeleteRowButton
                      label={`Delete ${best.label || 'personal best'}`}
                      onClick={() =>
                        setConfirmRequest({
                          title: 'Delete this personal best?',
                          body: (
                            <p>
                              <strong>{best.label || 'This personal best'}</strong> will be removed
                              from your public profile.
                            </p>
                          ),
                          confirmLabel: 'Delete',
                          onConfirm: () =>
                            setPersonalBests((prev) =>
                              prev.filter((entry) => entry.id !== best.id)
                            ),
                        })
                      }
                    />
                  </div>
                  <input
                    aria-label="Results URL"
                    type="url"
                    value={best.resultsUrl ?? ''}
                    onChange={(event) =>
                      setPersonalBests((prev) =>
                        prev.map((entry) =>
                          entry.id === best.id ? { ...entry, resultsUrl: event.target.value } : entry
                        )
                      )
                    }
                    placeholder="Results URL (optional)"
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              <EmptyState label="No personal bests yet." />
            </ul>
          )}
          <div className="mt-5 flex justify-end">
            <AddRowButton
              label="Add a personal best"
              onClick={() =>
                setPersonalBests((prev) => [...prev, { id: uid(), label: '', value: '' }])
              }
            />
          </div>
        </SectionCard>

        {/* Career Highlights */}
        <SectionCard icon="medal" title="Career Highlights" count={highlights.length}>
          {highlights.length > 0 ? (
            <SortableList
              items={highlights}
              getId={(item) => item.id}
              onReorder={(next) => setHighlights(() => next)}
            >
              {(item, index, sortable) => (
                <div
                  className={`space-y-3 rounded-input border border-outline-variant bg-surface-container-low p-4 ${
                    sortable.isDragging ? 'shadow-xl ring-2 ring-primary/25' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <DragHandle
                        label={`Drag ${item.title}`}
                        dragHandleProps={sortable.dragHandleProps}
                      />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        <Icon name="medal" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="label-bold text-on-surface">{item.title}</p>
                        <p className="text-xs text-on-surface-variant">
                          {item.date ? `${item.date} • ` : ''}
                          {item.detail}
                        </p>
                        <ResultsLink url={item.resultsUrl} />
                      </div>
                    </div>
                    <ItemMenu
                      label={`Actions for ${item.title}`}
                      onMoveUp={
                        index > 0
                          ? () => setHighlights((prev) => moveItem(prev, index, -1))
                          : undefined
                      }
                      onMoveDown={
                        index < highlights.length - 1
                          ? () => setHighlights((prev) => moveItem(prev, index, 1))
                          : undefined
                      }
                      onDelete={() =>
                        setConfirmRequest({
                          title: 'Delete this highlight?',
                          body: (
                            <p>
                              <strong>{item.title}</strong> will be removed from your public profile.
                            </p>
                          ),
                          confirmLabel: 'Delete',
                          onConfirm: () =>
                            setHighlights((prev) => prev.filter((entry) => entry.id !== item.id)),
                        })
                      }
                    />
                  </div>
                  <PhotoStrip photos={item.photos} />
                </div>
              )}
            </SortableList>
          ) : (
            <ul className="space-y-3">
              <EmptyState label="No highlights yet." />
            </ul>
          )}

          <form onSubmit={addHighlight} className="mt-5 space-y-3 rounded-input border border-outline-variant/60 bg-surface p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <input name="title" placeholder="Event (e.g. 2026 Boston Marathon)" className={inputClass} />
              <input name="date" placeholder="Date (e.g. Apr 20, 2026)" className={inputClass} />
              <input name="detail" placeholder="Result (e.g. 1st Female — 2:34:43)" className={inputClass} />
            </div>
            <input name="resultsUrl" type="url" placeholder="Results URL (https://results.race.com/...)" className={inputClass} />
            <PhotoUploader
              photos={highlightPhotos}
              onPick={(files) =>
                prepareImages(files, PROFILE_IMAGE_OPTIONS, (refs) =>
                  setHighlightPhotos((prev) => [...prev, ...refs])
                )
              }
              onRemove={(url) => setHighlightPhotos((prev) => prev.filter((entry) => entry !== url))}
            />
            <div className="flex justify-end">
              <AddButton />
            </div>
          </form>
        </SectionCard>

        {/* Previous Races */}
        <SectionCard icon="history" title="Previous Races" count={races.length}>
          {races.length > 0 ? (
            <SortableList
              items={races}
              getId={(item) => item.id}
              onReorder={(next) => setRaces(() => next)}
            >
              {(item, index, sortable) => (
                <div
                  className={`space-y-3 rounded-r-input border-l-4 border-primary bg-surface-container-low/60 p-4 ${
                    sortable.isDragging ? 'shadow-xl ring-2 ring-primary/25' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <DragHandle
                        label={`Drag ${item.name}`}
                        dragHandleProps={sortable.dragHandleProps}
                      />
                      <div className="min-w-0">
                        <p className="label-bold text-on-surface">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {item.date} • {item.result}
                        </p>
                        <ResultsLink url={item.resultsUrl} />
                      </div>
                    </div>
                    <ItemMenu
                      label={`Actions for ${item.name}`}
                      onMoveUp={
                        index > 0 ? () => setRaces((prev) => moveItem(prev, index, -1)) : undefined
                      }
                      onMoveDown={
                        index < races.length - 1
                          ? () => setRaces((prev) => moveItem(prev, index, 1))
                          : undefined
                      }
                      onDelete={() =>
                        setConfirmRequest({
                          title: 'Delete this race?',
                          body: (
                            <p>
                              <strong>{item.name}</strong> will be removed from your public profile.
                            </p>
                          ),
                          confirmLabel: 'Delete',
                          onConfirm: () =>
                            setRaces((prev) => prev.filter((entry) => entry.id !== item.id)),
                        })
                      }
                    />
                  </div>
                  <PhotoStrip photos={item.photos} />
                </div>
              )}
            </SortableList>
          ) : (
            <ul className="space-y-3">
              <EmptyState label="No races yet." />
            </ul>
          )}

          <form onSubmit={addRace} className="mt-5 space-y-3 rounded-input border border-outline-variant/60 bg-surface p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <input name="name" placeholder="Event name" className={inputClass} />
              <input name="date" placeholder="Date (e.g. Oct 12, 2025)" className={inputClass} />
              <input name="result" placeholder="Result (e.g. 1st Female — 2:39:50)" className={inputClass} />
            </div>
            <input name="resultsUrl" type="url" placeholder="Results URL (https://results.race.com/...)" className={inputClass} />
            <PhotoUploader
              photos={racePhotos}
              onPick={(files) =>
                prepareImages(files, PROFILE_IMAGE_OPTIONS, (refs) =>
                  setRacePhotos((prev) => [...prev, ...refs])
                )
              }
              onRemove={(url) => setRacePhotos((prev) => prev.filter((entry) => entry !== url))}
            />
            <div className="flex justify-end">
              <AddButton />
            </div>
          </form>
        </SectionCard>

        {/* Core Values */}
        <SectionCard icon="diamond" title="Core Values" count={coreValues.length}>
          {coreValues.length > 0 ? (
            <div className="space-y-3">
              {coreValues.map((value) => (
                <div
                  key={value.id}
                  className="flex items-start gap-3 rounded-input border border-outline-variant bg-surface-container-low p-4"
                >
                  <div className="grid flex-1 gap-3 md:grid-cols-[1fr_1.6fr]">
                    <input
                      aria-label="Value"
                      value={value.title}
                      onChange={(event) =>
                        setCoreValues((prev) =>
                          prev.map((entry) =>
                            entry.id === value.id ? { ...entry, title: event.target.value } : entry
                          )
                        )
                      }
                      placeholder="Value (e.g. Mental health)"
                      className={inputClass}
                    />
                    <input
                      aria-label="What it means to you"
                      value={value.body}
                      onChange={(event) =>
                        setCoreValues((prev) =>
                          prev.map((entry) =>
                            entry.id === value.id ? { ...entry, body: event.target.value } : entry
                          )
                        )
                      }
                      placeholder="What it means to you (e.g. Running is medicine.)"
                      className={inputClass}
                    />
                  </div>
                  <DeleteRowButton
                    label={`Delete ${value.title || 'core value'}`}
                    onClick={() =>
                      setConfirmRequest({
                        title: 'Delete this core value?',
                        body: (
                          <p>
                            <strong>{value.title || 'This value'}</strong> will be removed from your
                            public profile.
                          </p>
                        ),
                        confirmLabel: 'Delete',
                        onConfirm: () =>
                          setCoreValues((prev) => prev.filter((entry) => entry.id !== value.id)),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              <EmptyState label="No core values yet." />
            </ul>
          )}
          <div className="mt-5 flex justify-end">
            <AddRowButton
              label="Add a core value"
              onClick={() =>
                setCoreValues((prev) => [...prev, { id: uid(), title: '', body: '' }])
              }
            />
          </div>
        </SectionCard>

        {/* Roadmap */}
        <SectionCard icon="flag" title="2026 Roadmap" count={roadmap.length}>
          {roadmap.length > 0 ? (
            <SortableList
              items={roadmap}
              getId={(item) => item.id}
              onReorder={(next) => setRoadmap(() => next)}
            >
              {(item, index, sortable) => (
                <div
                  className={`flex items-center justify-between gap-4 rounded-input border border-outline-variant bg-surface-container-low p-4 ${
                    sortable.isDragging ? 'shadow-xl ring-2 ring-primary/25' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <DragHandle
                      label={`Drag ${item.name}`}
                      dragHandleProps={sortable.dragHandleProps}
                    />
                    <div className="min-w-0">
                      <p className="label-bold text-on-surface">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">{item.date}</p>
                    </div>
                  </div>
                  <ItemMenu
                    label={`Actions for ${item.name}`}
                    onMoveUp={
                      index > 0 ? () => setRoadmap((prev) => moveItem(prev, index, -1)) : undefined
                    }
                    onMoveDown={
                      index < roadmap.length - 1
                        ? () => setRoadmap((prev) => moveItem(prev, index, 1))
                        : undefined
                    }
                    onDelete={() =>
                      setConfirmRequest({
                        title: 'Delete this roadmap item?',
                        body: (
                          <p>
                            <strong>{item.name}</strong> will be removed from your public profile.
                          </p>
                        ),
                        confirmLabel: 'Delete',
                        onConfirm: () =>
                          setRoadmap((prev) => prev.filter((entry) => entry.id !== item.id)),
                      })
                    }
                  />
                </div>
              )}
            </SortableList>
          ) : (
            <ul className="space-y-3">
              <EmptyState label="No upcoming races yet." />
            </ul>
          )}

          <form onSubmit={addRoadmap} className="mt-5 grid gap-3 md:grid-cols-[1.5fr_1.2fr_auto]">
            <input name="name" placeholder="Upcoming event" className={inputClass} />
            <input name="date" placeholder="Date (e.g. August 16, 2026)" className={inputClass} />
            <AddButton />
          </form>
        </SectionCard>
      </div>

      <footer className="mt-10 border-t border-outline-variant pt-8 text-center">
        <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          {footerActions}
          <a
            href={publicHref}
            target="_blank"
            rel="noreferrer"
            className="label-bold inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border-2 border-primary px-5 py-2.5 text-primary transition-colors hover:bg-primary hover:text-on-primary"
          >
            View public page
            <Icon name="external" className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-4">{footer}</div>
      </footer>

      <ConfirmDialog
        open={confirmRequest !== null}
        title={confirmRequest?.title ?? ''}
        body={confirmRequest?.body ?? null}
        confirmLabel={confirmRequest?.confirmLabel ?? 'Confirm'}
        onCancel={() => setConfirmRequest(null)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

function PhotoUploader({
  photos,
  onPick,
  onRemove,
}: {
  photos: string[];
  onPick: (files: FileList) => void;
  onRemove: (url: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-input border-2 border-dashed border-outline-variant/60 bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary hover:text-primary">
        <input
          type="file"
          accept={IMAGE_UPLOAD_ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) onPick(event.target.files);
            event.target.value = '';
          }}
        />
        <Icon name="camera" className="h-5 w-5" />
        <span className="mt-1 text-[10px] font-bold">Add photos</span>
      </label>
      {photos.map((url) => (
        <div key={url} className="relative h-20 w-20 overflow-hidden rounded-input">
          <Image src={url} alt="Race photo" fill unoptimized sizes="80px" className="object-cover" />
          <button
            type="button"
            onClick={() => onRemove(url)}
            aria-label="Remove photo"
            className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end rounded-input p-1 text-white"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 transition-colors hover:bg-black/80">
              <Icon name="close" className="h-3 w-3" />
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

function PhotoStrip({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((url, index) => (
        <div key={url} className="relative h-16 w-16 overflow-hidden rounded-input">
          <Image src={url} alt={`Race photo ${index + 1}`} fill unoptimized sizes="64px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

function ResultsLink({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
    >
      <Icon name="link" className="h-3.5 w-3.5" />
      Results
    </a>
  );
}

function Recommendation({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-input bg-secondary-container/10 p-3 text-xs text-on-surface-variant">
      <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
      <p>{text}</p>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  count,
  children,
}: {
  icon: IconName;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Icon name={icon} className="h-6 w-6 text-primary" />
        <h2 className="font-display text-xl font-bold text-on-surface">{title}</h2>
        <span className="rounded-pill bg-surface-container px-2.5 py-0.5 text-xs font-bold text-on-surface-variant">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

function AddButton() {
  return (
    <button
      type="submit"
      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-input bg-primary-container px-4 py-2 text-sm font-bold text-on-primary transition-colors hover:bg-primary active:scale-95"
    >
      <Icon name="plus" className="h-4 w-4" />
      Add
    </button>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-input bg-primary-container px-4 py-2 text-sm font-bold text-on-primary transition-colors hover:bg-primary active:scale-95"
    >
      <Icon name="plus" className="h-4 w-4" />
      {label}
    </button>
  );
}

function DeleteRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error"
    >
      <Icon name="trash" className="h-4 w-4" />
    </button>
  );
}

function ResetButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="label-bold inline-flex min-h-11 items-center gap-2 rounded-pill border border-outline-variant px-4 py-2 text-on-surface-variant transition-colors hover:border-error hover:text-error"
    >
      <Icon name="history" className="h-4 w-4" />
      {label}
    </button>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="label-bold inline-flex min-h-11 items-center justify-center gap-2 rounded-pill bg-primary px-5 py-2.5 text-on-primary transition-all hover:bg-primary-strong disabled:opacity-60"
    >
      <Icon name={saving ? 'history' : 'check'} className="h-4 w-4" />
      {saving ? 'Saving...' : 'Save changes'}
    </button>
  );
}

function DragHandle({
  label,
  dragHandleProps,
}: {
  label: string;
  dragHandleProps: SortableItemRenderProps['dragHandleProps'];
}) {
  return (
    <button
      {...dragHandleProps}
      type="button"
      aria-label={label}
      title="Drag to reorder"
      className="mt-0.5 flex h-11 w-11 shrink-0 cursor-grab items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface-variant transition-colors hover:border-primary hover:text-primary active:cursor-grabbing"
    >
      <Icon name="drag-handle" className="h-4 w-4" />
    </button>
  );
}

function ItemMenu({
  label,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  label: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
}) {
  const closeMenu = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.closest('details')?.removeAttribute('open');
  };
  const runAction = (event: MouseEvent<HTMLButtonElement>, action: (() => void) | undefined) => {
    closeMenu(event);
    action?.();
  };
  const menuItemClass =
    'flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <details className="relative shrink-0">
      <summary
        aria-label={label}
        title={label}
        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface [&::-webkit-details-marker]:hidden"
      >
        <Icon name="more" className="h-5 w-5" />
      </summary>
      <div
        role="menu"
        className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-input border border-outline-variant bg-surface-container-lowest py-1 text-on-surface shadow-xl"
      >
        <button
          type="button"
          role="menuitem"
          disabled={!onMoveUp}
          onClick={(event) => runAction(event, onMoveUp)}
          className={menuItemClass}
        >
          <Icon name="chevron-solid" className="h-4 w-4 rotate-180" />
          Move up
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={!onMoveDown}
          onClick={(event) => runAction(event, onMoveDown)}
          className={menuItemClass}
        >
          <Icon name="chevron-solid" className="h-4 w-4" />
          Move down
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={(event) => runAction(event, onDelete)}
          className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-error transition-colors hover:bg-error/10"
        >
          <Icon name="trash" className="h-4 w-4" />
          Delete
        </button>
      </div>
    </details>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <li className="rounded-input border border-dashed border-outline-variant/60 p-4 text-center text-sm text-on-surface-variant">
      {label}
    </li>
  );
}

// --- Api-mode chrome (loading + owner gates) ---

function EditorLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12 md:px-16">
      <div className="h-6 w-32 animate-pulse rounded-pill bg-surface-container" />
      <div className="mt-4 h-10 w-64 animate-pulse rounded-input bg-surface-container" />
      <div className="mt-8 space-y-6">
        <div className="h-56 animate-pulse rounded-card bg-surface-container" />
        <div className="h-40 animate-pulse rounded-card bg-surface-container" />
      </div>
    </div>
  );
}

function EditorGate({
  variant,
  athleteSlug,
  ownerSlug,
}: {
  variant: 'signed-out' | 'not-owner' | 'error';
  athleteSlug: string;
  ownerSlug?: string | null;
}) {
  const copy = {
    'signed-out': {
      icon: 'lock' as IconName,
      title: 'Sign in to edit your page',
      body: 'The athlete view is only available to the athlete who owns this profile.',
    },
    'not-owner': {
      icon: 'lock' as IconName,
      title: 'This isn’t your page to edit',
      body: 'You can only edit your own athlete profile. View this athlete’s public page instead.',
    },
    error: {
      icon: 'history' as IconName,
      title: 'We couldn’t load the editor',
      body: 'Something went wrong loading your profile. Please try again.',
    },
  }[variant];

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-5 py-16 text-center">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-container/20 text-primary">
          <Icon name={copy.icon} className="h-7 w-7" />
        </span>
        <h1 className="font-display text-2xl font-extrabold text-on-surface">{copy.title}</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{copy.body}</p>
        <div className="mt-6 flex flex-col gap-3">
          {variant === 'signed-out' ? (
            <Link
              href="/sign-in"
              className="label-bold rounded-lg bg-primary px-6 py-3 text-on-primary transition-all hover:bg-primary-strong"
            >
              Sign in
            </Link>
          ) : null}
          <a
            href={athleteProfileHref(ownerSlug ?? athleteSlug)}
            className="label-bold rounded-lg border-2 border-outline px-6 py-3 text-on-surface transition-all hover:bg-surface-container"
          >
            View public page
          </a>
        </div>
      </div>
    </div>
  );
}
