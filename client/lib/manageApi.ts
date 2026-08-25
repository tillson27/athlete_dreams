import {
  ATHLETE_CORE_VALUES_MAX,
  ATHLETE_VALUE_MAX_LENGTH,
  ATHLETE_VALUES_MAX,
  type AthleteProfile,
  type ReplacePersonalBestsRequest,
  type SetAthleteGalleryRequest,
  type SetAthleteHighlightsRequest,
  type SetAthleteRaceResultsRequest,
  type SetAthleteRoadmapRequest,
  type UpdateAthleteProfileRequest,
} from 'fad-common';
import {
  ApiError,
  patchMyProfile,
  replaceMyGallery,
  replaceMyHighlights,
  replaceMyPersonalBests,
  replaceMyRaces,
  replaceMyRoadmap,
} from './api';
import { unsplashPhoto } from './unsplash';
import { uid } from './uid';
import type {
  AthleteEdits,
  EditArcChapter,
  EditCoreValue,
  EditHighlight,
  EditPersonalBest,
  EditRace,
  EditRoadmapItem,
  EditTraining,
} from './athleteEdits';
import { EMPTY_TRAINING, toEditArcChapter } from './athleteEdits';
import { profileToRichProfile } from './adapters';

// Pure, framework-free persistence for the /manage editor in `api` mode. The
// editor consumes these to load the owner's four editable sets from
// `GET /v1/athletes/me` and Save them back through the set-replace PUTs.
// Mirrors `client/lib/onboardingApi.ts`: kept out of the `'use client'` editor
// so the DTO <-> `AthleteEdits` mapping and the save error wording stay directly
// verifiable against a running API.
//
// Field mapping (editor field <-> API DTO field):
//   highlights: title <-> title; detail <-> detail; resultsUrl <-> resultUrl;
//               date <-> occurredOn; photos <-> photoRefs.
//   races:      name <-> resultName; date <-> displayDate; result <-> resultSummary;
//               resultsUrl <-> resultUrl; links <-> links; photos <-> photoRefs.
//   roadmap:    name <-> eventName; date <-> displayDate.
//   gallery:    display URL (composed via unsplashPhoto) <-> stored media ref.
//   storyIntro: <-> storyIntro (the tagline the profile leads with).
//   storyBody:  one textarea <-> storyBody (blank-line-separated paragraphs).
//   bests:      label <-> label; value <-> value; resultsUrl <-> resultUrl.
//   coreValues: title <-> title; body <-> body.
//   arcSubtitle/arcChapters/training <-> the same keys inside `presentation`.
//
// [STRICT] `presentation` is a whole-blob replace server-side, and it also
// carries keys this editor never shows (`highlightTones` / `raceTones`, which
// decide which highlights and races are featured, plus followers/support flags).
// Every save therefore merges the edited keys onto the profile's current blob —
// sending a bare `{ training, arcChapters }` would silently reshuffle the
// athlete's featured results.
//
// Photos/gallery come back as bare media refs or absolute URLs; the editor
// renders them with next/image, so a display URL is composed on load and the
// composed URL round-trips on save (both a bare ref and an absolute URL satisfy
// `mediaRefSchema`).

// The race set-replace requires a non-empty `displayDate`; a saved edit can omit
// the date, so fall back to the neutral placeholder the wizard also uses.
const RACE_DISPLAY_DATE_PLACEHOLDER = 'Date TBD';

// --- DTO -> editor (load) ---

function toEditHighlights(profile: AthleteProfile): EditHighlight[] {
  return profile.accomplishments.map((accomplishment) => ({
    id: uid(),
    title: accomplishment.title,
    detail: accomplishment.detail ?? accomplishment.description ?? '',
    ...(accomplishment.occurredOn ? { date: accomplishment.occurredOn } : {}),
    ...(accomplishment.resultUrl ? { resultsUrl: accomplishment.resultUrl } : {}),
    photos: accomplishment.photoRefs.map((ref) => unsplashPhoto(ref)),
  }));
}

function toEditRaces(profile: AthleteProfile): EditRace[] {
  return (profile.raceResults ?? []).map((race) => ({
    id: uid(),
    name: race.resultName,
    date: race.displayDate,
    result: race.resultSummary,
    ...(race.resultUrl ? { resultsUrl: race.resultUrl } : {}),
    ...(race.links.length > 0 ? { links: race.links } : {}),
    photos: race.photoRefs.map((ref) => unsplashPhoto(ref)),
  }));
}

function toEditRoadmap(profile: AthleteProfile): EditRoadmapItem[] {
  return (profile.roadmap ?? []).map((event) => ({
    id: uid(),
    name: event.eventName,
    date: event.displayDate,
  }));
}

function toEditGallery(profile: AthleteProfile): string[] {
  return (profile.gallery ?? []).map((ref) => unsplashPhoto(ref));
}

function toEditPersonalBests(profile: AthleteProfile): EditPersonalBest[] {
  return (profile.personalBests ?? []).map((best) => ({
    id: uid(),
    label: best.label,
    value: best.value,
    ...(best.resultUrl ? { resultsUrl: best.resultUrl } : {}),
  }));
}

// Onboarding writes bare value words to `values`; the editor owns `coreValues`.
// Merge them on load so a signup-era value is editable and deletable here rather
// than invisible and stuck.
function toEditCoreValues(profile: AthleteProfile): EditCoreValue[] {
  const stored = (profile.coreValues ?? []).map((value) => ({
    id: uid(),
    title: value.title,
    body: value.body ?? '',
  }));
  // A stored title longer than `ATHLETE_VALUE_MAX_LENGTH` is truncated on its way
  // into `values`, so match on the truncated form too or it bridges back as a
  // duplicate row.
  const seen = new Set(
    stored.flatMap((value) => [
      value.title.trim().toLowerCase(),
      value.title.trim().slice(0, ATHLETE_VALUE_MAX_LENGTH).toLowerCase(),
    ])
  );
  const bridged: EditCoreValue[] = [];
  for (const value of profile.values ?? []) {
    const title = value.trim();
    const key = title.toLowerCase();
    if (!title || seen.has(key)) continue;
    seen.add(key);
    bridged.push({ id: uid(), title, body: '' });
  }
  return [...stored, ...bridged].slice(0, ATHLETE_CORE_VALUES_MAX);
}

// Public API contract: the profile's current `presentation` blob, or an empty
// record when it has none. The editor holds this so saves can merge rather than
// clobber the keys it does not surface.
export function profileToPresentation(profile: AthleteProfile): Record<string, unknown> {
  const presentation = profile.presentation;
  return presentation !== null && typeof presentation === 'object' && !Array.isArray(presentation)
    ? (presentation as Record<string, unknown>)
    : {};
}

// Public API contract: derive the editor's `AthleteEdits` snapshot from the
// owner's rich profile DTO (mirrors `deriveEdits` for the mock/static source).
export function profileToEdits(profile: AthleteProfile): AthleteEdits {
  // The presentation blob is untyped, so reuse the profile adapter's defensive
  // readers rather than re-deriving arc/training parsing here.
  const rich = profileToRichProfile(profile);
  return {
    storyIntro: profile.storyIntro ?? '',
    storyBody: (profile.storyBody ?? []).join('\n\n'),
    arcSubtitle: rich.arcSubtitle,
    arcChapters: rich.arcChapters.map(toEditArcChapter),
    training: {
      ...EMPTY_TRAINING,
      ...rich.training,
      weeklyLoad: rich.training.weeklyLoad ?? '',
    },
    personalBests: toEditPersonalBests(profile),
    coreValues: toEditCoreValues(profile),
    highlights: toEditHighlights(profile),
    races: toEditRaces(profile),
    roadmap: toEditRoadmap(profile),
    gallery: toEditGallery(profile),
  };
}

// --- editor -> DTO (save) ---

// Public API contract: a save blocked by something the athlete can fix in the
// editor. Its `message` is athlete-facing copy and is shown verbatim in the save
// error banner, unlike transport failures which get a generic sentence.
export class ManageEditsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManageEditsValidationError';
  }
}

function toHighlightsRequest(highlights: EditHighlight[]): SetAthleteHighlightsRequest {
  const invalidHighlight = highlights.find(
    (highlight) =>
      !highlight.title.trim() &&
      (highlight.detail.trim() ||
        highlight.date?.trim() ||
        highlight.resultsUrl?.trim() ||
        highlight.photos.length > 0)
  );
  if (invalidHighlight) {
    throw new ManageEditsValidationError('A saved highlight needs a title.');
  }
  return {
    highlights: highlights
      .filter((highlight) => highlight.title.trim())
      .map((highlight) => {
        const detail = highlight.detail.trim();
        const resultUrl = highlight.resultsUrl?.trim();
        const occurredOn = highlight.date?.trim();
        return {
          title: highlight.title.trim(),
          ...(detail ? { detail } : {}),
          ...(resultUrl ? { resultUrl } : {}),
          ...(occurredOn ? { occurredOn } : {}),
          photoRefs: highlight.photos,
        };
      }),
  };
}

function toRacesRequest(races: EditRace[]): SetAthleteRaceResultsRequest {
  const invalidRace = races.find((race) => !race.name.trim());
  if (invalidRace) {
    throw new ManageEditsValidationError('A saved race needs an event name.');
  }
  return {
    races: races
      .filter((race) => race.name.trim())
      .map((race) => {
        const resultUrl = race.resultsUrl?.trim();
        const resultSummary = race.result.trim();
        const links = race.links?.filter((link) => link.label.trim() && link.href.trim());
        return {
          resultName: race.name.trim(),
          displayDate: race.date.trim() || RACE_DISPLAY_DATE_PLACEHOLDER,
          resultSummary: resultSummary || race.name.trim(),
          ...(resultUrl ? { resultUrl } : {}),
          ...(links && links.length > 0 ? { links } : {}),
          photoRefs: race.photos,
        };
      }),
  };
}

function toRoadmapRequest(roadmap: EditRoadmapItem[]): SetAthleteRoadmapRequest {
  const invalidRoadmapItem = roadmap.find((item) => !item.name.trim() || !item.date.trim());
  if (invalidRoadmapItem) {
    throw new ManageEditsValidationError('A roadmap item needs both event name and date.');
  }
  return {
    roadmap: roadmap
      .filter((item) => item.name.trim() && item.date.trim())
      .map((item) => ({
        eventName: item.name.trim(),
        displayDate: item.date.trim(),
      })),
  };
}

function toGalleryRequest(gallery: string[]): SetAthleteGalleryRequest {
  return { gallery };
}

function toPersonalBests(bests: EditPersonalBest[]): ReplacePersonalBestsRequest['personalBests'] {
  return bests
    .filter((best) => best.label.trim() && best.value.trim())
    .map((best) => {
      const resultUrl = best.resultsUrl?.trim();
      return {
        label: best.label.trim(),
        value: best.value.trim(),
        ...(resultUrl ? { resultUrl } : {}),
      };
    });
}

function toPresentationArcChapters(chapters: EditArcChapter[]): Record<string, unknown>[] {
  return chapters
    .filter((chapter) => chapter.title.trim())
    .map((chapter) => ({
      era: chapter.era.trim(),
      title: chapter.title.trim(),
      body: chapter.body.trim(),
      icon: chapter.icon,
      tone: chapter.tone,
      ...(chapter.current ? { current: true } : {}),
      ...(chapter.photo ? { image: chapter.photo } : {}),
    }));
}

// The profile card treats an all-blank snapshot as "coming soon", so trimmed
// empties round-trip as empty strings rather than being dropped.
function toPresentationTraining(training: EditTraining): Record<string, unknown> {
  const weeklyLoad = training.weeklyLoad.trim();
  return {
    weeklyKm: training.weeklyKm.trim(),
    weeklyTime: training.weeklyTime.trim(),
    weeklyGain: training.weeklyGain.trim(),
    latestTitle: training.latestTitle.trim(),
    latestMeta: training.latestMeta.trim(),
    ...(weeklyLoad ? { weeklyLoad } : {}),
  };
}

function toMergedPresentation(
  edits: AthleteEdits,
  basePresentation: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...basePresentation,
    arcSubtitle: edits.arcSubtitle.trim(),
    arcChapters: toPresentationArcChapters(edits.arcChapters),
    training: toPresentationTraining(edits.training),
  };
}

// Story and core values ride the same PATCH. `storyIntro` is sent even when
// blank so clearing the tagline in the editor clears it on the server too.
function toStoryAndValuesPatch(edits: AthleteEdits): UpdateAthleteProfileRequest {
  const untitledValue = edits.coreValues.find(
    (value) => !value.title.trim() && value.body.trim()
  );
  if (untitledValue) {
    throw new ManageEditsValidationError('A saved core value needs a title.');
  }
  const titledValues = edits.coreValues.filter((value) => value.title.trim());
  if (titledValues.length > ATHLETE_CORE_VALUES_MAX) {
    throw new ManageEditsValidationError(
      `Keep it to ${ATHLETE_CORE_VALUES_MAX} core values — remove a few and save again.`
    );
  }
  const titles = titledValues.map((value) => value.title.trim());
  const patch: UpdateAthleteProfileRequest = {
    coreValues: titledValues.map((value) => ({
      title: value.title.trim(),
      body: value.body.trim(),
    })),
    // `values` is rewritten from the surviving titles rather than left alone, so
    // deleting a bridged value sticks instead of resurrecting on the next load.
    // It is never emptied while titles remain: the dashboard completeness item
    // and the publish-readiness gate both read `profile.values.length`.
    values: titles.map((title) => title.slice(0, ATHLETE_VALUE_MAX_LENGTH)).slice(0, ATHLETE_VALUES_MAX),
  };
  patch.storyIntro = edits.storyIntro.trim();
  patch.storyBody = edits.storyBody
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
  return patch;
}

// --- Save behind the seam ---

// Save the editor sets via their owner-scoped endpoints. Runs sequentially so a
// mid-save failure surfaces one clear error rather than racing writes; each
// write is last-write-wins server-side for the single owner.
export async function saveEditsToApi(
  edits: AthleteEdits,
  basePresentation: Record<string, unknown>,
  coverPhoto?: string
): Promise<void> {
  await patchMyProfile({
    ...toStoryAndValuesPatch(edits),
    presentation: toMergedPresentation(edits, basePresentation),
    ...(coverPhoto ? { heroMediaUrl: coverPhoto } : {}),
  });
  await replaceMyPersonalBests(toPersonalBests(edits.personalBests));
  await replaceMyHighlights(toHighlightsRequest(edits.highlights));
  await replaceMyRaces(toRacesRequest(edits.races));
  await replaceMyRoadmap(toRoadmapRequest(edits.roadmap));
  await replaceMyGallery(toGalleryRequest(edits.gallery));
}

// One plain sentence for the editor's save error banner — never a raw payload or
// code (Context §11, client/AGENTS.md minimalism).
export function toManageSaveError(error: unknown): string {
  if (error instanceof ManageEditsValidationError) {
    return error.message;
  }
  if (error instanceof ApiError && error.status === 401) {
    return 'Your session expired. Sign in again to save your changes.';
  }
  return "We couldn't save your changes. Please try again.";
}
