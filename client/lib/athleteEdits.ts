import type { RichAthleteProfile } from './athleteProfiles';
import { unsplashPhoto } from './unsplash';
import { createBrowserStore } from './browserStore';
import { uid } from './uid';

// Frontend-only edit store for the /manage editor. Seeds from the published
// athleteProfiles data, then persists an athlete's edits to localStorage so
// they survive reloads and show up on the public profile.

export type EditHighlight = {
  id: string;
  title: string;
  detail: string;
  date?: string;
  resultsUrl?: string;
  photos: string[];
};
export type EditRace = {
  id: string;
  name: string;
  date: string;
  result: string;
  resultsUrl?: string;
  links?: { label: string; href: string }[];
  photos: string[];
};
export type EditRoadmapItem = { id: string; name: string; date: string };
export type EditPersonalBest = { id: string; label: string; value: string; resultsUrl?: string };
export type EditCoreValue = { id: string; title: string; body: string };

export type AthleteEdits = {
  coverPhoto?: string;
  storyIntro: string;
  storyBody: string;
  personalBests: EditPersonalBest[];
  coreValues: EditCoreValue[];
  highlights: EditHighlight[];
  races: EditRace[];
  roadmap: EditRoadmapItem[];
  gallery: string[];
};

export const EDITS_EVENT = 'arc-athlete-edits-change';
const storeFor = (slug: string) => createBrowserStore<AthleteEdits>(`arc-manage-${slug}`, EDITS_EVENT);

// Public API contract: derive an editable snapshot from published profile data.
export function deriveEdits(profile: RichAthleteProfile): AthleteEdits {
  return {
    storyIntro: profile.storyIntro,
    storyBody: profile.storyBody.join('\n\n'),
    personalBests: profile.personalBests.map((best) => ({
      id: uid(),
      label: best.label,
      value: best.value,
    })),
    coreValues: profile.coreValues.map((value) => ({
      id: uid(),
      title: value.title,
      body: value.body,
    })),
    highlights: [...profile.careerHighlights, ...profile.moreResults].map((highlight) => ({
      id: uid(),
      title: highlight.title,
      detail: highlight.detail,
      photos: highlight.images.map((image) => unsplashPhoto(image)),
    })),
    races: [
      ...profile.previousRaces.map((race) => ({
        id: uid(),
        name: race.name,
        date: race.date,
        result: race.result,
        links: race.links,
        photos: race.images.map((image) => unsplashPhoto(image)),
      })),
      ...profile.morePreviousRaces.map((race) => ({
        id: uid(),
        name: race.name,
        date: race.date,
        result: race.result,
        photos: race.images.map((image) => unsplashPhoto(image)),
      })),
    ],
    roadmap: profile.roadmap.map((event) => ({ id: uid(), name: event.name, date: event.date })),
    gallery: profile.galleryPhotos.map((image) => unsplashPhoto(image)),
  };
}

// Edits saved before the story/bests/values sections existed are missing those
// keys, so every read is normalized back to the full shape.
export function loadEdits(slug: string): AthleteEdits | null {
  const saved = storeFor(slug).read();
  if (!saved) return null;
  return {
    ...saved,
    storyIntro: saved.storyIntro ?? '',
    storyBody: saved.storyBody ?? '',
    personalBests: saved.personalBests ?? [],
    coreValues: saved.coreValues ?? [],
  };
}

export function saveEdits(slug: string, edits: AthleteEdits) {
  storeFor(slug).write(edits);
}

export function clearEdits(slug: string) {
  storeFor(slug).write(null);
}

/** Notifies on any athlete's edit change (same-tab and cross-tab); returns unsubscribe. */
export function subscribeToEdits(slug: string, listener: () => void): () => void {
  return storeFor(slug).subscribe(listener);
}
