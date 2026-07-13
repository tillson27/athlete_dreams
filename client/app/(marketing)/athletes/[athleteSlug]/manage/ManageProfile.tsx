'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AthleteMediaKind,
  AthleteMediaRole,
  AthleteResultKind,
  type AthleteProfileDraft,
} from 'fad-common';
import {
  deleteMyMediaAsset,
  deleteMyResult,
  deleteMyRoadmapEvent,
  getMyDraft,
  reorderMyResults,
  reorderMyRoadmapEvents,
  upsertMyMediaAsset,
  upsertMyResult,
  upsertMyRoadmapEvent,
} from '@/lib/api/athletes';
import {
  toEditableView,
  type ProfileEditableView,
  type ProfileHighlightView,
  type ProfileRaceView,
  type ProfileRoadmapView,
} from '@/lib/api/athleteViews';
import { useSession } from '@/lib/session';
import { Icon } from '@/components/ui/Icon';
import {
  AddButton,
  EmptyState,
  PhotoStrip,
  PhotoUploader,
  Recommendation,
  RemoveButton,
  ReorderControls,
  ResultsLink,
  SectionCard,
} from './ManageProfileParts';

const inputClass =
  'w-full rounded-input border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/25';

function toObjectUrls(files: FileList): string[] {
  return Array.from(files).map((file) => URL.createObjectURL(file));
}

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function httpUrls(urls: string[]): string[] {
  return urls.filter((url) => url.startsWith('http://') || url.startsWith('https://'));
}

function sourceLinks(resultsUrl: string): { label: string; href: string }[] | undefined {
  if (!resultsUrl.startsWith('http://') && !resultsUrl.startsWith('https://')) return undefined;
  return [{ label: 'Results', href: resultsUrl }];
}

const emptyEditableView: ProfileEditableView = {
  highlights: [],
  races: [],
  roadmap: [],
  gallery: [],
};

export function ManageProfile({
  athleteSlug,
  fallbackAthleteName,
  fallbackCoverPhoto,
}: {
  athleteSlug: string;
  fallbackAthleteName: string;
  fallbackCoverPhoto: string;
}) {
  const { session, ready } = useSession();
  const accessToken = session?.accessToken;
  const [draft, setDraft] = useState<AthleteProfileDraft | null>(null);
  const [editable, setEditable] = useState<ProfileEditableView>(emptyEditableView);
  const [coverPhoto, setCoverPhoto] = useState<string>(fallbackCoverPhoto);
  const [highlightPhotos, setHighlightPhotos] = useState<string[]>([]);
  const [racePhotos, setRacePhotos] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [mutationFailed, setMutationFailed] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getMyDraft(accessToken)
      .then((profileDraft) => {
        if (cancelled) return;
        setDraft(profileDraft);
        setEditable(toEditableView(profileDraft));
        setCoverPhoto(profileDraft.heroMediaUrl ?? profileDraft.profileImageUrl ?? fallbackCoverPhoto);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, fallbackCoverPhoto]);

  const athleteName = draft?.fullName ?? fallbackAthleteName;
  const profileVersion = draft?.profileVersion ?? 0;

  const applyDraft = (nextDraft: AthleteProfileDraft) => {
    setDraft(nextDraft);
    setEditable(toEditableView(nextDraft));
    setCoverPhoto(nextDraft.heroMediaUrl ?? nextDraft.profileImageUrl ?? fallbackCoverPhoto);
  };

  const resetToSaved = () => {
    if (!draft) return;
    setEditable(toEditableView(draft));
    setCoverPhoto(draft.heroMediaUrl ?? draft.profileImageUrl ?? fallbackCoverPhoto);
  };

  const runMutation = async (mutation: () => Promise<AthleteProfileDraft>): Promise<boolean> => {
    if (pending) return false;
    setPending(true);
    setMutationFailed(false);
    try {
      applyDraft(await mutation());
      return true;
    } catch {
      setMutationFailed(true);
      return false;
    } finally {
      setPending(false);
    }
  };

  const addHighlight = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = String(data.get('title') ?? '').trim();
    const detail = String(data.get('detail') ?? '').trim();
    const date = String(data.get('date') ?? '').trim();
    const resultsUrl = String(data.get('resultsUrl') ?? '').trim();
    if (!title || !detail) return;
    void runMutation(() =>
      upsertMyResult(accessToken, {
        expectedProfileVersion: profileVersion,
        resultKind: AthleteResultKind.Highlight,
        title,
        resultText: detail,
        eventDateLabel: date || null,
        sourceLinks: sourceLinks(resultsUrl),
        mediaUrls: httpUrls(highlightPhotos),
      })
    ).then((saved) => {
      if (saved) {
        form.reset();
        setHighlightPhotos([]);
      }
    });
  };

  const addRace = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const date = String(data.get('date') ?? '').trim();
    const result = String(data.get('result') ?? '').trim();
    const resultsUrl = String(data.get('resultsUrl') ?? '').trim();
    if (!name || !date || !result) return;
    void runMutation(() =>
      upsertMyResult(accessToken, {
        expectedProfileVersion: profileVersion,
        resultKind: AthleteResultKind.Race,
        title: name,
        resultText: result,
        eventDateLabel: date,
        sourceLinks: sourceLinks(resultsUrl),
        mediaUrls: httpUrls(racePhotos),
      })
    ).then((saved) => {
      if (saved) {
        form.reset();
        setRacePhotos([]);
      }
    });
  };

  const addRoadmap = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const date = String(data.get('date') ?? '').trim();
    if (!name || !date) return;
    void runMutation(() =>
      upsertMyRoadmapEvent(accessToken, {
        expectedProfileVersion: profileVersion,
        eventName: name,
        eventDateLabel: date,
      })
    ).then((saved) => {
      if (saved) form.reset();
    });
  };

  const addGalleryUrl = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;
    const form = event.currentTarget;
    const mediaUrl = String(new FormData(form).get('mediaUrl') ?? '').trim();
    if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) return;
    void runMutation(() =>
      upsertMyMediaAsset(accessToken, {
        expectedProfileVersion: profileVersion,
        mediaKind: AthleteMediaKind.Image,
        mediaRole: AthleteMediaRole.Gallery,
        mediaUrl,
        sortOrder: editable.gallery.length,
      })
    ).then((saved) => {
      if (saved) form.reset();
    });
  };

  const removeResult = (athleteResultId: string) => {
    if (!accessToken) return;
    void runMutation(() =>
      deleteMyResult(accessToken, athleteResultId, { expectedProfileVersion: profileVersion })
    );
  };

  const removeRoadmap = (athleteRoadmapEventId: string) => {
    if (!accessToken) return;
    void runMutation(() =>
      deleteMyRoadmapEvent(accessToken, athleteRoadmapEventId, {
        expectedProfileVersion: profileVersion,
      })
    );
  };

  const removeGallery = (athleteMediaAssetId: string) => {
    if (!accessToken) return;
    void runMutation(() =>
      deleteMyMediaAsset(accessToken, athleteMediaAssetId, {
        expectedProfileVersion: profileVersion,
      })
    );
  };

  const reorderResults = (orderedItems: Array<ProfileHighlightView | ProfileRaceView>) => {
    if (!accessToken) return;
    void runMutation(() =>
      reorderMyResults(accessToken, {
        expectedProfileVersion: profileVersion,
        orderedChildIds: orderedItems.map((item) => item.id),
      })
    );
  };

  const reorderRoadmap = (orderedItems: ProfileRoadmapView[]) => {
    if (!accessToken) return;
    void runMutation(() =>
      reorderMyRoadmapEvents(accessToken, {
        expectedProfileVersion: profileVersion,
        orderedChildIds: orderedItems.map((item) => item.id),
      })
    );
  };

  if (!ready || (accessToken && !draft && !loadFailed)) {
    return (
      <div className="mx-auto w-full max-w-4xl px-5 py-12 md:px-16">
        <div className="h-8 w-44 animate-pulse rounded-pill bg-surface-container" />
        <div className="mt-5 h-48 animate-pulse rounded-card bg-surface-container" />
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-5 py-16 text-center">
        <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
          <Icon name="lock" className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-on-surface">
            Sign in to manage your page
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Profile edits are saved to your athlete draft.
          </p>
          <Link
            href="/sign-in"
            className="label-bold mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-on-primary transition-all hover:bg-primary-strong"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-16 text-center">
        <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8">
          <Icon name="help" className="mx-auto h-10 w-10 text-error" />
          <h1 className="mt-4 font-display text-2xl font-extrabold text-on-surface">
            Editor unavailable
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            We couldn&rsquo;t load your draft profile. Try again from the dashboard.
          </p>
        </div>
      </div>
    );
  }

  const combinedResults = [...editable.highlights, ...editable.races];

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12 md:px-16">
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
          <button
            type="button"
            onClick={resetToSaved}
            disabled={pending}
            className="label-bold inline-flex items-center gap-2 rounded-pill border border-outline-variant px-4 py-2 text-on-surface-variant transition-colors hover:border-error hover:text-error disabled:opacity-50"
          >
            <Icon name="history" className="h-4 w-4" />
            Reset to saved
          </button>
          <Link
            href={`/athletes/${athleteSlug}`}
            className="label-bold inline-flex items-center gap-2 rounded-pill border border-outline-variant px-4 py-2 text-on-surface transition-colors hover:bg-surface-container"
          >
            View public page
            <Icon name="external" className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {mutationFailed ? (
        <div className="mb-6 rounded-input border border-error/30 bg-error-container/20 p-4 text-sm font-semibold text-error">
          We couldn&rsquo;t save that change. Refresh your draft and try again.
        </div>
      ) : null}

      <div className="space-y-6">
        <SectionCard icon="camera" title="Photos" count={editable.gallery.length + 1}>
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
                    if (files?.length) setCoverPhoto(toObjectUrls(files)[0]);
                    event.target.value = '';
                  }}
                />
                <Icon name="camera" className="h-3.5 w-3.5" />
                Replace cover
              </label>
            </div>
            <Recommendation text="Best on the app: a wide landscape shot, 16:9, at least 1920 × 1080 px (JPG or WebP, under 5 MB). It fills the full-width hero banner, so keep faces and key action near the centre." />
          </div>
          <div>
            <p className="label-bold mb-2 text-on-surface">Gallery</p>
            <div className="flex flex-wrap gap-3">
              {editable.gallery.map((photo, index) => (
                <div key={photo.id} className="relative h-24 w-24 overflow-hidden rounded-input">
                  <Image
                    src={photo.url}
                    alt={`Gallery photo ${index + 1}`}
                    fill
                    unoptimized
                    sizes="96px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGallery(photo.id)}
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <Icon name="close" className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={addGalleryUrl} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                name="mediaUrl"
                type="url"
                placeholder="Photo URL (https://...)"
                className={inputClass}
              />
              <AddButton />
            </form>
            <Recommendation text="Gallery photos save when they use an HTTPS image URL. Local uploads stay as previews until ARC adds hosted media storage." />
          </div>
        </SectionCard>
        <SectionCard icon="medal" title="Career Highlights" count={editable.highlights.length}>
          <ul className="space-y-3">
            {editable.highlights.map((item, index) => (
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
                      isLast={index === editable.highlights.length - 1}
                      onUp={() => reorderResults(moveItem(combinedResults, index, -1))}
                      onDown={() => reorderResults(moveItem(combinedResults, index, 1))}
                    />
                    <RemoveButton onClick={() => removeResult(item.id)} />
                  </div>
                </div>
                <PhotoStrip photos={item.photos} />
              </li>
            ))}
            {editable.highlights.length === 0 ? <EmptyState label="No highlights yet." /> : null}
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
              onPick={(files) => setHighlightPhotos((prev) => [...prev, ...toObjectUrls(files)])}
              onRemove={(url) => setHighlightPhotos((prev) => prev.filter((entry) => entry !== url))}
            />
            <div className="flex justify-end">
              <AddButton />
            </div>
          </form>
        </SectionCard>
        <SectionCard icon="history" title="Previous Races" count={editable.races.length}>
          <ul className="space-y-3">
            {editable.races.map((item, index) => {
              const resultIndex = editable.highlights.length + index;
              return (
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
                        isLast={index === editable.races.length - 1}
                        onUp={() => reorderResults(moveItem(combinedResults, resultIndex, -1))}
                        onDown={() => reorderResults(moveItem(combinedResults, resultIndex, 1))}
                      />
                      <RemoveButton onClick={() => removeResult(item.id)} />
                    </div>
                  </div>
                  <PhotoStrip photos={item.photos} />
                </li>
              );
            })}
            {editable.races.length === 0 ? <EmptyState label="No races yet." /> : null}
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
              onPick={(files) => setRacePhotos((prev) => [...prev, ...toObjectUrls(files)])}
              onRemove={(url) => setRacePhotos((prev) => prev.filter((entry) => entry !== url))}
            />
            <div className="flex justify-end">
              <AddButton />
            </div>
          </form>
        </SectionCard>
        <SectionCard icon="flag" title="2026 Roadmap" count={editable.roadmap.length}>
          <ul className="space-y-3">
            {editable.roadmap.map((item, index) => (
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
                    isLast={index === editable.roadmap.length - 1}
                    onUp={() => reorderRoadmap(moveItem(editable.roadmap, index, -1))}
                    onDown={() => reorderRoadmap(moveItem(editable.roadmap, index, 1))}
                  />
                  <RemoveButton onClick={() => removeRoadmap(item.id)} />
                </div>
              </li>
            ))}
            {editable.roadmap.length === 0 ? <EmptyState label="No upcoming races yet." /> : null}
          </ul>

          <form onSubmit={addRoadmap} className="mt-5 grid gap-3 md:grid-cols-[1.5fr_1.2fr_auto]">
            <input name="name" placeholder="Upcoming event" className={inputClass} />
            <input name="date" placeholder="Date (e.g. August 16, 2026)" className={inputClass} />
            <AddButton />
          </form>
        </SectionCard>
      </div>

      <p className="mt-8 text-center text-xs text-on-surface-variant">
        Changes save to your profile. Local image uploads are previews until ARC adds photo hosting.
      </p>
    </div>
  );
}
