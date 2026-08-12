import type {
  AthleteProfile,
  ReplacePersonalBestsRequest,
  SetAthleteGalleryRequest,
  SetAthleteHighlightsRequest,
  SetAthleteRaceResultsRequest,
  SetAthleteRoadmapRequest,
  UpdateAthleteProfileRequest,
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
  EditCoreValue,
  EditHighlight,
  EditPersonalBest,
  EditRace,
  EditRoadmapItem,
} from './athleteEdits';

// Pure, framework-free persistence for the /manage editor in `api` mode. The
// editor consumes these to load the owner's four editable sets from
// `GET /v1/athletes/me` and Save them back through the set-replace PUTs.
// Mirrors `client/lib/onboardingApi.ts`: kept out of the `'use client'` editor
// so the DTO <-> `AthleteEdits` mapping and the save error wording stay directly
// verifiable against a running API.
//
// Field mapping (editor field <-> API DTO field):
//   highlights: title <-> title; detail <-> detail; resultsUrl <-> resultUrl;
//               photos <-> photoRefs. The editor's per-highlight `date` has no
//               API column (the highlights set-replace contract carries no date),
//               so it is dropped on save.
//   races:      name <-> resultName; date <-> displayDate; result <-> resultSummary;
//               resultsUrl <-> resultUrl; links <-> links; photos <-> photoRefs.
//   roadmap:    name <-> eventName; date <-> displayDate.
//   gallery:    display URL (composed via unsplashPhoto) <-> stored media ref.
//   storyIntro: <-> storyIntro (the tagline the profile leads with).
//   storyBody:  one textarea <-> storyBody (blank-line-separated paragraphs).
//   bests:      label <-> label; value <-> value; resultsUrl <-> resultUrl.
//   coreValues: title <-> title; body <-> body.
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

function toEditCoreValues(profile: AthleteProfile): EditCoreValue[] {
  return (profile.coreValues ?? []).map((value) => ({
    id: uid(),
    title: value.title,
    body: value.body,
  }));
}

// Public API contract: derive the editor's `AthleteEdits` snapshot from the
// owner's rich profile DTO (mirrors `deriveEdits` for the mock/static source).
export function profileToEdits(profile: AthleteProfile): AthleteEdits {
  return {
    storyIntro: profile.storyIntro ?? '',
    storyBody: (profile.storyBody ?? []).join('\n\n'),
    personalBests: toEditPersonalBests(profile),
    coreValues: toEditCoreValues(profile),
    highlights: toEditHighlights(profile),
    races: toEditRaces(profile),
    roadmap: toEditRoadmap(profile),
    gallery: toEditGallery(profile),
  };
}

// --- editor -> DTO (save) ---

function toHighlightsRequest(highlights: EditHighlight[]): SetAthleteHighlightsRequest {
  return {
    highlights: highlights
      .filter((highlight) => highlight.title.trim())
      .map((highlight) => {
        const detail = highlight.detail.trim();
        const resultUrl = highlight.resultsUrl?.trim();
        return {
          title: highlight.title.trim(),
          ...(detail ? { detail } : {}),
          ...(resultUrl ? { resultUrl } : {}),
          photoRefs: highlight.photos,
        };
      }),
  };
}

function toRacesRequest(races: EditRace[]): SetAthleteRaceResultsRequest {
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

// Story and core values ride the same PATCH. `storyIntro` is only sent when the
// athlete typed one, because the publish guard treats an empty tagline as
// "unpublishable" and a blank PATCH would silently un-publish a live profile.
function toStoryAndValuesPatch(edits: AthleteEdits): UpdateAthleteProfileRequest {
  const patch: UpdateAthleteProfileRequest = {
    coreValues: edits.coreValues
      .filter((value) => value.title.trim() && value.body.trim())
      .map((value) => ({ title: value.title.trim(), body: value.body.trim() })),
  };
  const storyIntro = edits.storyIntro.trim();
  if (storyIntro) patch.storyIntro = storyIntro;
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
  coverPhoto?: string
): Promise<void> {
  await patchMyProfile({
    ...toStoryAndValuesPatch(edits),
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
  if (error instanceof ApiError && error.status === 401) {
    return 'Your session expired — sign in again to save your changes.';
  }
  return "We couldn't save your changes — please try again.";
}
