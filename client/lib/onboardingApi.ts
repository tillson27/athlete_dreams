import type {
  AthleteProfile,
  AthleteStoryAnswers,
  CreateAthleteProfileRequest,
  ReplacePersonalBestsRequest,
  SetAthleteHighlightsRequest,
  SetAthleteRaceResultsRequest,
  UpdateAthleteProfileRequest,
} from 'fad-common';
import { athleteStoryAnswersSchema } from 'fad-common';
import {
  ApiError,
  createMyProfile,
  fetchMyProfile,
  patchMyProfile,
  publishMyProfile,
  replaceMyHighlights,
  replaceMyPersonalBests,
  replaceMyRaces,
} from './api';
import { slugifyName } from './slugify';
import { uid } from './uid';
import type {
  CareerHighlight,
  OnboardingProfile,
  PersonalBest,
  PreviousRace,
} from '@/app/register/_components/onboardingProfile';
import { hasStoryAnswers } from './storyDraft';

// Pure, framework-free persistence for the onboarding wizard in `api` mode.
// `OnboardingContext` consumes these to create the profile on step-1 advance,
// PATCH per step, set-replace personal bests / highlights / races, and publish.
// Kept out of the `'use client'` context module so the field mapping and error
// wording stay directly verifiable against a running API.
//
// Field mapping (wizard field -> API field), faithful to the seed semantics and
// the publish guard (`storyIntro` + >=1 personal best):
//   name         -> athleteSlug (slugified, 409-retried) + fullName
//   location     -> hometown
//   bio ("story")-> storyBody (paragraph array; the long narrative)
//   mission      -> storyIntro (the short tagline hook the profile leads with)
//   values       -> values
//   personalBests-> personalBests { distance->label, time->value, resultUrl }
//   highlights   -> highlights { title, detail, resultUrl }
//   races        -> races { name->resultName, result->resultSummary, resultUrl }

const RUNNER_PRIMARY_SPORT = 'RUNNING' as const;

// The wizard captures no race date; the API requires a non-empty `displayDate`
// and the manage editor (where dates are added) fills it in later. This neutral
// placeholder satisfies the contract and reads cleanly on the profile.
const RACE_DISPLAY_DATE_PLACEHOLDER = 'Date TBD';

// Bounded slug retry per Context §11-§12: each 409 changes the slug so the
// attempt is idempotent; after `-5` we surface a readable error.
const MAX_SLUG_SUFFIX = 5;

function paragraphsFromBio(bio: string): string[] {
  return bio
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function baseSlug(name: string): string {
  const slug = slugifyName(name);
  // slugSchema requires >=2 chars; pad a too-short/empty derivation so the first
  // create attempt is always valid (the 409 retry then appends -2..-5).
  return slug.length >= 2 ? slug : `${slug || 'athlete'}-profile`;
}

export function toCreateRequest(
  profile: OnboardingProfile,
  athleteSlug: string
): CreateAthleteProfileRequest {
  const request: CreateAthleteProfileRequest = {
    athleteSlug,
    fullName: profile.name.trim(),
    primarySport: RUNNER_PRIMARY_SPORT,
  };
  const hometown = profile.location.trim();
  if (hometown) request.hometown = hometown;
  const values = profile.values.filter((value) => value.trim().length > 0);
  if (values.length > 0) request.values = values;
  return request;
}

// Step 1 (identity + story): everything create can't take that step 1 owns.
// `primarySport` is create-only, so it is not repeated here. `storyBody` carries
// the long-form bio; `storyIntro` (the tagline) is a step-3 field.
export function toStep1Patch(
  profile: OnboardingProfile,
  existing: AthleteProfile | null
): UpdateAthleteProfileRequest {
  const patch: UpdateAthleteProfileRequest = {};
  const fullName = profile.name.trim();
  if (fullName) patch.fullName = fullName;
  const hometown = profile.location.trim();
  if (hometown) patch.hometown = hometown;
  const storyBody = paragraphsFromBio(profile.bio);
  if (storyBody.length > 0) patch.storyBody = storyBody;
  if (profile.heroPhoto?.trim()) patch.heroMediaUrl = profile.heroPhoto.trim();
  if (hasStoryAnswers(profile.storyAnswers) || hasStoredStoryAnswers(existing)) {
    patch.presentation = {
      ...(existing?.presentation ?? {}),
      storyAnswers: profile.storyAnswers,
    };
  }
  return patch;
}

// Step 3 (values + voice): the multi-select values and the tagline -> storyIntro,
// the short hook the profile's "My Story" leads with and the publish guard needs.
export function toStep3Patch(profile: OnboardingProfile): UpdateAthleteProfileRequest {
  const patch: UpdateAthleteProfileRequest = {
    values: profile.values.filter((value) => value.trim().length > 0),
  };
  const storyIntro = profile.mission.trim();
  if (storyIntro) patch.storyIntro = storyIntro;
  return patch;
}

export function toPersonalBests(
  profile: OnboardingProfile
): ReplacePersonalBestsRequest['personalBests'] {
  return profile.personalBests
    .filter((best) => best.distance.trim() && best.time.trim())
    .map((best) => {
      const resultUrl = best.resultUrl?.trim();
      return {
        label: best.distance.trim(),
        value: best.time.trim(),
        ...(resultUrl ? { resultUrl } : {}),
      };
    });
}

export function toHighlights(profile: OnboardingProfile): SetAthleteHighlightsRequest['highlights'] {
  return profile.careerHighlights
    .filter((item) => item.title.trim())
    .map((item) => {
      const detail = item.detail.trim();
      const resultUrl = item.resultUrl?.trim();
      return {
        title: item.title.trim(),
        ...(detail ? { detail } : {}),
        ...(resultUrl ? { resultUrl } : {}),
      };
    });
}

export function toRaces(profile: OnboardingProfile): SetAthleteRaceResultsRequest['races'] {
  return profile.previousRaces
    .filter((item) => item.name.trim())
    .map((item) => {
      const resultUrl = item.resultUrl?.trim();
      const resultSummary = item.result.trim();
      return {
        resultName: item.name.trim(),
        displayDate: RACE_DISPLAY_DATE_PLACEHOLDER,
        resultSummary: resultSummary || item.name.trim(),
        ...(resultUrl ? { resultUrl } : {}),
      };
    });
}

// Hydrate the wizard from an existing draft (re-entry / resume). Reverses the
// create/PATCH/set-replace mapping so the in-progress preview and every field
// re-populate exactly as they were last saved.
export function profileToOnboarding(apiProfile: AthleteProfile): OnboardingProfile {
  const personalBests: PersonalBest[] = (apiProfile.personalBests ?? []).map((best) => ({
    id: uid(),
    distance: best.label,
    time: best.value,
    ...(best.resultUrl ? { resultUrl: best.resultUrl } : {}),
  }));
  const careerHighlights: CareerHighlight[] = apiProfile.accomplishments.map((item) => ({
    id: uid(),
    title: item.title,
    detail: item.detail ?? item.description ?? '',
    ...(item.resultUrl ? { resultUrl: item.resultUrl } : {}),
  }));
  const previousRaces: PreviousRace[] = (apiProfile.raceResults ?? []).map((race) => ({
    id: uid(),
    name: race.resultName,
    result: race.resultSummary,
    ...(race.resultUrl ? { resultUrl: race.resultUrl } : {}),
  }));

  return {
    name: apiProfile.fullName,
    location: apiProfile.hometown ?? '',
    heroPhoto: apiProfile.heroMediaUrl ?? undefined,
    bio: (apiProfile.storyBody ?? []).join('\n\n'),
    storyAnswers: parseStoryAnswers(apiProfile.presentation),
    personalBests,
    careerHighlights,
    previousRaces,
    values: apiProfile.values,
    mission: apiProfile.storyIntro ?? '',
  };
}

// Draft lookup on wizard entry: the caller's own profile, or null when none
// exists yet (a 404 means "start a fresh wizard").
export async function loadDraftProfile(): Promise<AthleteProfile | null> {
  try {
    return await fetchMyProfile();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

// First save (step-1 advance): create the profile, retrying the slug on a
// collision (`<slug>-2` .. `<slug>-5`) so a claimed name never blocks a new
// athlete on a common name; if the caller already has a profile, resume it.
//
// The API signals the two create conflicts as 409s with a discriminator: a
// taken slug carries `details.field === 'athleteSlug'` (retry with the next
// candidate), while a duplicate *user* profile has no field discriminator
// (resume the existing draft — a fresh slug would not help).
export async function createProfileWithSlugRetry(
  profile: OnboardingProfile
): Promise<AthleteProfile> {
  const root = baseSlug(profile.name);
  const candidates = [
    root,
    ...Array.from({ length: MAX_SLUG_SUFFIX - 1 }, (_, index) => `${root}-${index + 2}`),
  ];

  for (const athleteSlug of candidates) {
    try {
      return await createMyProfile(toCreateRequest(profile, athleteSlug));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        if (isSlugConflict(error.details)) {
          continue;
        }
        // The user already has a profile: resume it instead of reserving a new slug.
        return fetchMyProfile();
      }
      throw error;
    }
  }
  // Exhausted every candidate on a slug collision: surface a conflict so the UI
  // reads it as "URL taken" rather than a generic error.
  throw new ApiError('Could not reserve a profile URL after several attempts.', 'conflict', 409);
}

function isSlugConflict(details: unknown): boolean {
  return (
    typeof details === 'object' &&
    details !== null &&
    (details as { field?: unknown }).field === 'athleteSlug'
  );
}

// Step-1 advance: create-on-first-save (idempotent per attempt), then apply the
// step-1 PATCH. A half-created draft (create ok, PATCH failed) still resumes on
// re-entry via `loadDraftProfile`.
export async function saveStep1(
  profile: OnboardingProfile,
  existing: AthleteProfile | null
): Promise<AthleteProfile> {
  const draft = existing ?? (await createProfileWithSlugRetry(profile));
  return patchMyProfile(toStep1Patch(profile, draft));
}

function parseStoryAnswers(presentation: AthleteProfile['presentation']): AthleteStoryAnswers {
  if (!presentation || typeof presentation !== 'object') return {};
  const parsed = athleteStoryAnswersSchema.safeParse(presentation.storyAnswers);
  return parsed.success ? parsed.data : {};
}

function hasStoredStoryAnswers(existing: AthleteProfile | null): boolean {
  if (!existing?.presentation || typeof existing.presentation !== 'object') return false;
  return 'storyAnswers' in existing.presentation;
}

// Step 2 set-replaces run sequentially so a mid-step failure surfaces one clear
// error rather than racing three writes; each is last-write-wins server-side.
export async function saveStep2(profile: OnboardingProfile): Promise<AthleteProfile> {
  await replaceMyPersonalBests(toPersonalBests(profile));
  await replaceMyHighlights({ highlights: toHighlights(profile) });
  return replaceMyRaces({ races: toRaces(profile) });
}

export async function saveStep3(profile: OnboardingProfile): Promise<AthleteProfile> {
  return patchMyProfile(toStep3Patch(profile));
}

export async function publishDraft(): Promise<void> {
  await publishMyProfile();
}

// --- Error wording (curated sentences, following client/lib/authErrors.ts) ---

// Maps the publish-guard 422 keys to a plain checklist sentence apiece.
const PUBLISH_MISSING_SENTENCES: Record<string, string> = {
  storyIntro: 'Step 3 - Values & Voice: add your tagline',
  personalBests: 'Step 2 - Athletics & Achievements: add at least one personal best',
};

export function toPublishChecklist(details: unknown): string[] {
  const missing =
    details !== null &&
    typeof details === 'object' &&
    'missing' in details &&
    Array.isArray((details as { missing: unknown }).missing)
      ? (details as { missing: unknown[] }).missing.filter(
          (entry): entry is string => typeof entry === 'string'
        )
      : [];
  return missing.map((key) => PUBLISH_MISSING_SENTENCES[key] ?? `Add your ${key}`);
}

// One plain sentence for an inline per-step save error — never a raw payload or
// code (Context §11, client/AGENTS.md minimalism). A 409 on save means the URL
// collided after we reserved one; every other failure is generic.
export function toSaveErrorSentence(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) {
    return 'That profile URL is taken — try a slightly different name in Step 1.';
  }
  return "We couldn't save your progress — please try again.";
}
