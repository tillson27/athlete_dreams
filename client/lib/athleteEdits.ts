import type { ArcChapter, ChapterIcon, ChapterTone, RichAthleteProfile } from './athleteProfiles';
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

/** One chapter of the profile's "<Name>'s journey" timeline. */
export type EditArcChapter = {
  id: string;
  era: string;
  title: string;
  body: string;
  icon: ChapterIcon;
  tone: ChapterTone;
  current: boolean;
  photo?: string;
};

/** The profile's Training Snapshot card. Every field is free text — the card
 *  renders labels ("Weekly KM", "Time", "Gain") and stays hidden while empty. */
export type EditTraining = {
  weeklyKm: string;
  weeklyTime: string;
  weeklyGain: string;
  weeklyLoad: string;
  latestTitle: string;
  latestMeta: string;
};

export const EMPTY_TRAINING: EditTraining = {
  weeklyKm: '',
  weeklyTime: '',
  weeklyGain: '',
  weeklyLoad: '',
  latestTitle: '',
  latestMeta: '',
};

export const CHAPTER_ICONS: ChapterIcon[] = [
  'medal',
  'heart',
  'history',
  'trophy',
  'flag',
  'timer',
  'book',
  'groups',
];

export const CHAPTER_TONES: ChapterTone[] = ['primary', 'secondary', 'tertiary'];

export type AthleteEdits = {
  coverPhoto?: string;
  storyIntro: string;
  storyBody: string;
  arcSubtitle: string;
  arcChapters: EditArcChapter[];
  training: EditTraining;
  personalBests: EditPersonalBest[];
  coreValues: EditCoreValue[];
  highlights: EditHighlight[];
  races: EditRace[];
  roadmap: EditRoadmapItem[];
  gallery: string[];
};

export const EDITS_EVENT = 'arc-athlete-edits-change';
const storeFor = (slug: string) => createBrowserStore<AthleteEdits>(`arc-manage-${slug}`, EDITS_EVENT);

export function toEditArcChapter(chapter: ArcChapter): EditArcChapter {
  return {
    id: uid(),
    era: chapter.era,
    title: chapter.title,
    body: chapter.body,
    icon: chapter.icon,
    tone: chapter.tone,
    current: chapter.current === true,
    ...(chapter.image ? { photo: unsplashPhoto(chapter.image) } : {}),
  };
}

// Public API contract: derive an editable snapshot from published profile data.
export function deriveEdits(profile: RichAthleteProfile): AthleteEdits {
  return {
    storyIntro: profile.storyIntro,
    storyBody: profile.storyBody.join('\n\n'),
    arcSubtitle: profile.arcSubtitle,
    arcChapters: profile.arcChapters.map(toEditArcChapter),
    training: {
      weeklyKm: profile.training.weeklyKm,
      weeklyTime: profile.training.weeklyTime,
      weeklyGain: profile.training.weeklyGain,
      weeklyLoad: profile.training.weeklyLoad ?? '',
      latestTitle: profile.training.latestTitle,
      latestMeta: profile.training.latestMeta,
    },
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
      ...(highlight.date ? { date: highlight.date } : {}),
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
    arcSubtitle: saved.arcSubtitle ?? '',
    arcChapters: saved.arcChapters ?? [],
    training: saved.training ?? EMPTY_TRAINING,
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
