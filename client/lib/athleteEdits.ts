import type { RichAthleteProfile } from './athleteProfiles';

// Frontend-only edit store for the /manage editor. Seeds from the published
// athleteProfiles data, then persists an athlete's edits to localStorage so
// they survive reloads and show up on the public profile — until a real
// backend replaces it. Uploaded photos use blob: URLs that can't survive a
// reload, so they are stripped on save (photo hosting is a Path-B concern).

const IMG = (id: string, width = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;

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
  links?: string[];
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
const keyFor = (slug: string) => `arc-manage-${slug}`;
const uid = () => Math.random().toString(36).slice(2, 10);

// Public API contract: derive an editable snapshot from published profile data.
export function deriveEdits(profile: RichAthleteProfile): AthleteEdits {
  return {
    highlights: [...profile.careerHighlights, ...profile.moreResults].map((highlight) => ({
      id: uid(),
      title: highlight.title,
      detail: highlight.detail,
      photos: highlight.images.map((image) => IMG(image)),
    })),
    races: [
      ...profile.previousRaces.map((race) => ({
        id: uid(),
        name: race.name,
        date: race.date,
        result: race.result,
        links: race.links,
        photos: race.images.map((image) => IMG(image)),
      })),
      ...profile.morePreviousRaces.map((race) => ({
        id: uid(),
        name: race.name,
        date: race.date,
        result: race.result,
        photos: race.images.map((image) => IMG(image)),
      })),
    ],
    roadmap: profile.roadmap.map((event) => ({ id: uid(), name: event.name, date: event.date })),
    gallery: profile.galleryPhotos.map((image) => IMG(image)),
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
  try {
    const raw = window.localStorage.getItem(keyFor(slug));
    return raw ? (JSON.parse(raw) as AthleteEdits) : null;
  } catch {
    return null;
  }
}

export function saveEdits(slug: string, edits: AthleteEdits) {
  try {
    window.localStorage.setItem(keyFor(slug), JSON.stringify(stripBlobPhotos(edits)));
    window.dispatchEvent(new Event(EDITS_EVENT));
  } catch {
    /* storage unavailable — edits simply won't persist */
  }
}

export function clearEdits(slug: string) {
  try {
    window.localStorage.removeItem(keyFor(slug));
    window.dispatchEvent(new Event(EDITS_EVENT));
  } catch {
    /* storage unavailable — nothing to clear */
  }
}
