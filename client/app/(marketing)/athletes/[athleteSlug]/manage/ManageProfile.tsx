'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { findAthleteProfile } from '@/lib/athleteProfiles';
import {
  deriveEdits,
  loadEdits,
  saveEdits,
  clearEdits,
  type AthleteEdits,
  type EditHighlight as Highlight,
  type EditRace as Race,
  type EditRoadmapItem as RoadmapItem,
} from '@/lib/prototype/athleteEdits';
import { uid } from '@/lib/uid';
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

const toObjectUrls = (files: FileList) => Array.from(files).map((file) => URL.createObjectURL(file));

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function ManageProfile({
  athleteSlug,
  athleteName,
  initialCoverPhoto,
}: {
  athleteSlug: string;
  athleteName: string;
  initialCoverPhoto: string;
}) {
  const published = useMemo<AthleteEdits>(() => {
    const profile = findAthleteProfile(athleteSlug);
    return profile ? deriveEdits(profile) : { highlights: [], races: [], roadmap: [], gallery: [] };
  }, [athleteSlug]);

  const [highlights, setHighlights] = useState<Highlight[]>(published.highlights);
  const [races, setRaces] = useState<Race[]>(published.races);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>(published.roadmap);
  const [coverPhoto, setCoverPhoto] = useState<string>(initialCoverPhoto);
  const [gallery, setGallery] = useState<string[]>(published.gallery);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadEdits(athleteSlug);
    if (saved) {
      setHighlights(saved.highlights);
      setRaces(saved.races);
      setRoadmap(saved.roadmap);
      setGallery(saved.gallery);
    }
    setHydrated(true);
  }, [athleteSlug]);

  useEffect(() => {
    if (!hydrated) return;
    saveEdits(athleteSlug, { highlights, races, roadmap, gallery });
  }, [hydrated, athleteSlug, highlights, races, roadmap, gallery]);

  const resetToPublished = () => {
    clearEdits(athleteSlug);
    setHighlights(published.highlights);
    setRaces(published.races);
    setRoadmap(published.roadmap);
    setGallery(published.gallery);
    setCoverPhoto(initialCoverPhoto);
  };

  const [highlightPhotos, setHighlightPhotos] = useState<string[]>([]);
  const [racePhotos, setRacePhotos] = useState<string[]>([]);

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
            onClick={resetToPublished}
            className="label-bold inline-flex items-center gap-2 rounded-pill border border-outline-variant px-4 py-2 text-on-surface-variant transition-colors hover:border-error hover:text-error"
          >
            <Icon name="history" className="h-4 w-4" />
            Reset to published
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

      <div className="space-y-6">
        <SectionCard icon="camera" title="Photos" count={gallery.length + 1}>
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
              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-input border-2 border-dashed border-outline-variant/60 bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary hover:text-primary">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files?.length) {
                      setGallery((prev) => [...prev, ...toObjectUrls(event.target.files as FileList)]);
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
              onPick={(files) => setHighlightPhotos((prev) => [...prev, ...toObjectUrls(files)])}
              onRemove={(url) => setHighlightPhotos((prev) => prev.filter((entry) => entry !== url))}
            />
            <div className="flex justify-end">
              <AddButton />
            </div>
          </form>
        </SectionCard>
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
              onPick={(files) => setRacePhotos((prev) => [...prev, ...toObjectUrls(files)])}
              onRemove={(url) => setRacePhotos((prev) => prev.filter((entry) => entry !== url))}
            />
            <div className="flex justify-end">
              <AddButton />
            </div>
          </form>
        </SectionCard>
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

      <p className="mt-8 text-center text-xs text-on-surface-variant">
        Changes save to this browser and appear on your public profile. Uploaded photos stay on this
        device until we add photo hosting.
      </p>
    </div>
  );
}
