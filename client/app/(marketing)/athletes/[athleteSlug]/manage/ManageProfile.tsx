'use client';

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/Icon';
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
  type EditHighlight as Highlight,
  type EditRace as Race,
  type EditRoadmapItem as RoadmapItem,
} from '@/lib/athleteEdits';
import { fetchMyProfile } from '@/lib/api';
import { profileToEdits, saveEditsToApi, toManageSaveError } from '@/lib/manageApi';
import {
  COVER_IMAGE_OPTIONS,
  PROFILE_IMAGE_OPTIONS,
  filesToPersistedImageRefs,
  toImageUploadErrorMessage,
} from '@/lib/imageUploads';
import { uid } from '@/lib/uid';

const inputClass =
  'w-full rounded-input border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/25';

const EMPTY_EDITS: AthleteEdits = { highlights: [], races: [], roadmap: [], gallery: [] };

// Swap an item with its neighbour to move it up (-1) or down (+1) the list.
function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// Mode seam. Mock mode (default, GitHub Pages / static export) is byte-identical
// to the prototype: seed from the published athleteProfiles data and auto-save
// edits to `arc-manage-<slug>` localStorage. Api mode loads the owner's four
// editable sets from `GET /v1/athletes/me` and Saves them via the set-replace
// PUTs, gated to the signed-in owner of the slug.
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
      footer={
        <p className="mt-8 text-center text-xs text-on-surface-variant">
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
  | { kind: 'ready'; athleteName: string; edits: AthleteEdits; coverPhoto: string };

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
        if (profile.athleteSlug !== athleteSlug) {
          setState({ kind: 'not-owner', ownerSlug: profile.athleteSlug });
          return;
        }
        setState({
          kind: 'ready',
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
      athleteSlug={athleteSlug}
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
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await saveEditsToApi(edits, coverDirty ? coverPhoto : undefined);
      setCoverDirty(false);
      setSaved(true);
    } catch (error) {
      setSaveError(toManageSaveError(error));
    } finally {
      setSaving(false);
    }
  };

  // Any edit invalidates the "Saved" acknowledgement so it never lingers stale.
  const setEditsAndClearSaved = (
    updater: AthleteEdits | ((current: AthleteEdits) => AthleteEdits)
  ) => {
    setSaved(false);
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
        setSaved(false);
        setCoverDirty(true);
        setCoverPhoto(url);
      }}
      headerActions={
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="label-bold inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-2 text-on-primary transition-all hover:bg-primary-strong disabled:opacity-60"
        >
          <Icon name={saving ? 'history' : 'check'} className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      }
      footer={
        <div className="mt-8 text-center text-xs">
          {saveError ? (
            <p className="text-error">{saveError}</p>
          ) : saved ? (
            <p className="text-success">Saved. Your public profile is up to date.</p>
          ) : (
            <p className="text-on-surface-variant">
              Changes save to your profile when you tap Save.
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
  footer,
}: {
  athleteName: string;
  publicHref: string;
  edits: AthleteEdits;
  setEdits: (updater: AthleteEdits | ((current: AthleteEdits) => AthleteEdits)) => void;
  coverPhoto: string;
  setCoverPhoto: (url: string) => void;
  headerActions: ReactNode;
  footer: ReactNode;
}) {
  const { highlights, races, roadmap, gallery } = edits;
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
            className="label-bold inline-flex items-center gap-2 rounded-pill border border-outline-variant px-4 py-2 text-on-surface transition-colors hover:bg-surface-container"
          >
            <Icon name="arrow-back" className="h-4 w-4" />
            Dashboard
          </Link>
          {headerActions}
          <a
            href={publicHref}
            className="label-bold inline-flex items-center gap-2 rounded-pill border border-outline-variant px-4 py-2 text-on-surface transition-colors hover:bg-surface-container"
          >
            View public page
            <Icon name="external" className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="space-y-6">
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
                  accept="image/*"
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
            <Recommendation text="Best on the app: a wide landscape shot, 16:9, at least 1920 × 1080 px (JPG or WebP, under 5 MB). It fills the full-width hero banner, so keep faces and key action near the centre." />
          </div>

          {/* Gallery */}
          <div>
            <p className="label-bold mb-2 text-on-surface">Gallery</p>
            <div className="flex flex-wrap gap-3">
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-input border-2 border-dashed border-outline-variant/60 bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary hover:text-primary">
                <input
                  type="file"
                  accept="image/*"
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
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <Icon name="close" className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <Recommendation text="Gallery photos display as squares — upload 1:1 crops at least 800 × 800 px so they stay sharp on high-resolution screens." />
          </div>
        </SectionCard>

        {/* Career Highlights */}
        <SectionCard icon="medal" title="Career Highlights" count={highlights.length}>
          <ul className="space-y-3">
            {highlights.map((item, index) => (
              <li
                key={item.id}
                className="space-y-3 rounded-input border border-outline-variant bg-surface-container-low p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                      <Icon name="medal" className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="label-bold text-on-surface">{item.title}</p>
                      <p className="text-xs text-on-surface-variant">
                        {item.date ? `${item.date} • ` : ''}
                        {item.detail}
                      </p>
                      <ResultsLink url={item.resultsUrl} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ReorderControls
                      isFirst={index === 0}
                      isLast={index === highlights.length - 1}
                      onUp={() => setHighlights((prev) => moveItem(prev, index, -1))}
                      onDown={() => setHighlights((prev) => moveItem(prev, index, 1))}
                    />
                    <RemoveButton onClick={() => setHighlights((prev) => prev.filter((entry) => entry.id !== item.id))} />
                  </div>
                </div>
                <PhotoStrip photos={item.photos} />
              </li>
            ))}
            {highlights.length === 0 ? <EmptyState label="No highlights yet." /> : null}
          </ul>

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
          <ul className="space-y-3">
            {races.map((item, index) => (
              <li
                key={item.id}
                className="space-y-3 rounded-r-input border-l-4 border-primary bg-surface-container-low/60 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="label-bold text-on-surface">{item.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {item.date} • {item.result}
                    </p>
                    <ResultsLink url={item.resultsUrl} />
                  </div>
                  <div className="flex items-center gap-1">
                    <ReorderControls
                      isFirst={index === 0}
                      isLast={index === races.length - 1}
                      onUp={() => setRaces((prev) => moveItem(prev, index, -1))}
                      onDown={() => setRaces((prev) => moveItem(prev, index, 1))}
                    />
                    <RemoveButton onClick={() => setRaces((prev) => prev.filter((entry) => entry.id !== item.id))} />
                  </div>
                </div>
                <PhotoStrip photos={item.photos} />
              </li>
            ))}
            {races.length === 0 ? <EmptyState label="No races yet." /> : null}
          </ul>

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

        {/* Roadmap */}
        <SectionCard icon="flag" title="2026 Roadmap" count={roadmap.length}>
          <ul className="space-y-3">
            {roadmap.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-input border border-outline-variant bg-surface-container-low p-4"
              >
                <div>
                  <p className="label-bold text-on-surface">{item.name}</p>
                  <p className="text-xs text-on-surface-variant">{item.date}</p>
                </div>
                <div className="flex items-center gap-1">
                  <ReorderControls
                    isFirst={index === 0}
                    isLast={index === roadmap.length - 1}
                    onUp={() => setRoadmap((prev) => moveItem(prev, index, -1))}
                    onDown={() => setRoadmap((prev) => moveItem(prev, index, 1))}
                  />
                  <RemoveButton onClick={() => setRoadmap((prev) => prev.filter((entry) => entry.id !== item.id))} />
                </div>
              </li>
            ))}
            {roadmap.length === 0 ? <EmptyState label="No upcoming races yet." /> : null}
          </ul>

          <form onSubmit={addRoadmap} className="mt-5 grid gap-3 md:grid-cols-[1.5fr_1.2fr_auto]">
            <input name="name" placeholder="Upcoming event" className={inputClass} />
            <input name="date" placeholder="Date (e.g. August 16, 2026)" className={inputClass} />
            <AddButton />
          </form>
        </SectionCard>
      </div>

      {footer}
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
          accept="image/*"
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
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          >
            <Icon name="close" className="h-3 w-3" />
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
      className="inline-flex items-center justify-center gap-1.5 rounded-input bg-primary-container px-4 py-2 text-sm font-bold text-on-primary transition-colors hover:bg-primary active:scale-95"
    >
      <Icon name="plus" className="h-4 w-4" />
      Add
    </button>
  );
}

function ResetButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="label-bold inline-flex items-center gap-2 rounded-pill border border-outline-variant px-4 py-2 text-on-surface-variant transition-colors hover:border-error hover:text-error"
    >
      <Icon name="history" className="h-4 w-4" />
      {label}
    </button>
  );
}

function ReorderControls({
  onUp,
  onDown,
  isFirst,
  isLast,
}: {
  onUp: () => void;
  onDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const buttonClass =
    'rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';
  return (
    <div className="flex flex-col">
      <button type="button" onClick={onUp} disabled={isFirst} aria-label="Move up" className={buttonClass}>
        <Icon name="chevron-solid" className="h-4 w-4 rotate-180" />
      </button>
      <button type="button" onClick={onDown} disabled={isLast} aria-label="Move down" className={buttonClass}>
        <Icon name="chevron-solid" className="h-4 w-4" />
      </button>
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove"
      className="shrink-0 rounded-full p-2 text-error transition-colors hover:bg-error-container/30"
    >
      <Icon name="trash" className="h-4 w-4" />
    </button>
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
