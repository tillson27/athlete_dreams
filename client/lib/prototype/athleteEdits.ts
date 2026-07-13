import type { RichAthleteProfile } from '../athleteProfiles';
import { unsplashPhoto } from '../unsplash';
import { createBrowserStore } from './browserStore';
import { uid } from '../uid';

// TODO: Replace this prototype editor store with profile child APIs in Step 9.

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

export type AthleteEdits = {
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

function stripBlobPhotos(edits: AthleteEdits): AthleteEdits {
  const keep = (url: string) => !url.startsWith('blob:');
  return {
    highlights: edits.highlights.map((h) => ({ ...h, photos: h.photos.filter(keep) })),
    races: edits.races.map((r) => ({ ...r, photos: r.photos.filter(keep) })),
    roadmap: edits.roadmap,
    gallery: edits.gallery.filter(keep),
  };
}

export function loadEdits(slug: string): AthleteEdits | null {
  return storeFor(slug).read();
}

export function saveEdits(slug: string, edits: AthleteEdits) {
  storeFor(slug).write(stripBlobPhotos(edits));
}

export function clearEdits(slug: string) {
  storeFor(slug).write(null);
}

// Public API contract: returns an unsubscribe for same-tab and cross-tab edit changes.
export function subscribeToEdits(slug: string, listener: () => void): () => void {
  return storeFor(slug).subscribe(listener);
}
