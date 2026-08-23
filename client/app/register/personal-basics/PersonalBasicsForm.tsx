'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { AthleteStoryAnswers, AthleteStoryQuestionId } from 'fad-common';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { ProfilePreview } from '../_components/ProfilePreview';
import { EditReturnBanner } from '../_components/EditReturnBanner';
import { StepAdvance } from '../_components/StepAdvance';
import { useOnboarding } from '../_components/OnboardingContext';
import { formInputClass as inputClass } from '@/components/ui/formStyles';
import {
  COVER_IMAGE_OPTIONS,
  IMAGE_UPLOAD_ACCEPT,
  filesToPersistedImageRefs,
  toImageUploadErrorMessage,
  type PrepareImagesProgress,
} from '@/lib/imageUploads';
import { STORY_QUESTIONS, composeStoryDraft, hasStoryAnswers } from '@/lib/storyDraft';

export function PersonalBasicsForm() {
  const fromReview = useSearchParams().get('from') === 'review';
  const { profile, update } = useOnboarding();
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const lastGeneratedRef = useRef('');
  const [uploadProgress, setUploadProgress] = useState<PrepareImagesProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const generatedDraft = composeStoryDraft(profile.storyAnswers);
  const athleteEditedStory =
    hasStoryAnswers(profile.storyAnswers) &&
    profile.bio.trim().length > 0 &&
    profile.bio !== generatedDraft;

  useEffect(() => {
    if (generatedDraft && profile.bio === generatedDraft) {
      lastGeneratedRef.current = generatedDraft;
    }
  }, [generatedDraft, profile.bio]);

  const applyStoryAnswers = (nextAnswers: AthleteStoryAnswers) => {
    const nextDraft = composeStoryDraft(nextAnswers);
    const shouldPreserveStory =
      profile.bio.trim().length > 0 && profile.bio !== lastGeneratedRef.current;
    if (shouldPreserveStory) {
      update({ storyAnswers: nextAnswers });
      return;
    }
    lastGeneratedRef.current = nextDraft;
    update({ storyAnswers: nextAnswers, bio: nextDraft });
  };

  const toggleStorySelection = (questionId: AthleteStoryQuestionId, selection: string) => {
    const currentAnswer = profile.storyAnswers[questionId] ?? { selections: [] };
    const selections = currentAnswer.selections.includes(selection)
      ? currentAnswer.selections.filter((entry) => entry !== selection)
      : [...currentAnswer.selections, selection];
    applyStoryAnswers({
      ...profile.storyAnswers,
      [questionId]: {
        ...currentAnswer,
        selections,
      },
    });
  };

  const updateExtraWords = (questionId: AthleteStoryQuestionId, extraWords: string) => {
    const currentAnswer = profile.storyAnswers[questionId] ?? { selections: [] };
    applyStoryAnswers({
      ...profile.storyAnswers,
      [questionId]: {
        ...currentAnswer,
        extraWords,
      },
    });
  };

  const rewriteStory = () => {
    lastGeneratedRef.current = generatedDraft;
    update({ bio: generatedDraft });
    requestAnimationFrame(() => bioRef.current?.focus());
  };

  const pickHero = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    void filesToPersistedImageRefs(files, COVER_IMAGE_OPTIONS, setUploadProgress)
      .then(({ refs, failures }) => {
        if (refs[0]) update({ heroPhoto: refs[0] });
        if (failures[0]) setUploadError(failures[0]);
      })
      .catch((error: unknown) => setUploadError(toImageUploadErrorMessage(error)))
      .finally(() => {
        setUploadProgress(null);
        if (heroInputRef.current) heroInputRef.current.value = '';
      });
  };

  return (
    <>
      {fromReview ? <EditReturnBanner /> : null}
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        {/* LIVE PREVIEW */}
        <div className="order-2 md:order-1">
          <ProfilePreview />
        </div>

        {/* FORM */}
        <div className="order-1 flex flex-col gap-8 md:order-2">
          <div>
            <span className="eyebrow mb-2 block text-on-surface md:hidden">
              Step 1 of 4
            </span>
            <h2 className="mb-2 font-display text-2xl font-extrabold text-on-surface sm:text-3xl md:text-4xl">
              Let&rsquo;s build your profile
            </h2>
            <p className="text-lg text-tertiary">
              Start with who you are and where you&rsquo;re headed. Watch it come together in the
              preview.
            </p>
          </div>

          <form className="flex flex-col gap-6 rounded-card border border-outline-variant bg-surface-container-lowest p-6 shadow-sm sm:p-8">
            <Field label="Your name" htmlFor="full_name">
              <input
                id="full_name"
                type="text"
                value={profile.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="e.g. Maya Okafor"
                className={inputClass}
              />
              <p className="text-xs text-on-surface-variant">
                We started with your account name. You can change it here.
              </p>
            </Field>

            <Field label="Location (city, country)" htmlFor="location">
              <div className="relative">
                <Icon
                  name="location"
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tertiary"
                />
                <input
                  id="location"
                  type="text"
                  value={profile.location}
                  onChange={(event) => update({ location: event.target.value })}
                  placeholder="e.g. Lethbridge, AB"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </Field>

            <Field label="Hero photo" htmlFor="hero_photo">
              <div className="flex flex-col gap-3 rounded-input border border-outline-variant bg-surface p-3">
                {profile.heroPhoto ? (
                  <Image
                    src={profile.heroPhoto}
                    alt=""
                    width={640}
                    height={180}
                    className="h-32 w-full rounded-input object-cover"
                    unoptimized={profile.heroPhoto.startsWith('data:')}
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="hero_photo"
                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-on-secondary transition-all hover:bg-secondary/90"
                  >
                    <Icon name="camera" className="h-4 w-4" />
                    Choose photo
                  </label>
                  {profile.heroPhoto ? (
                    <button
                      type="button"
                      onClick={() => update({ heroPhoto: undefined })}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-sm font-bold text-on-surface-variant transition-all hover:border-error hover:text-error"
                    >
                      <Icon name="trash" className="h-4 w-4" />
                      Remove
                    </button>
                  ) : null}
                </div>
                <input
                  ref={heroInputRef}
                  id="hero_photo"
                  type="file"
                  accept={IMAGE_UPLOAD_ACCEPT}
                  className="sr-only"
                  onChange={(event) => pickHero(event.target.files)}
                />
                <p className="text-xs text-on-surface-variant">
                  Wide landscape works best: at least 1920x1080, faces near the centre.
                </p>
                {uploadProgress ? (
                  <p className="text-xs font-semibold text-secondary">
                    Preparing {uploadProgress.completed}/{uploadProgress.total}
                  </p>
                ) : null}
                {uploadError ? <p className="text-sm font-semibold text-error">{uploadError}</p> : null}
              </div>
            </Field>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="label-bold text-on-surface" htmlFor="bio">
                  Your story
                </label>
                <span className="text-xs text-tertiary">{profile.bio.length} characters</span>
              </div>
              <div className="grid gap-4">
                {STORY_QUESTIONS.map((question) => {
                  const answer = profile.storyAnswers[question.questionId] ?? { selections: [] };
                  return (
                    <fieldset
                      key={question.questionId}
                      className="rounded-input border border-outline-variant bg-surface p-4"
                    >
                      <legend className="label-bold px-1 text-on-surface">
                        {question.prompt}
                      </legend>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {question.options.map((option) => {
                          const active = answer.selections.includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              aria-pressed={active}
                              onClick={() => toggleStorySelection(question.questionId, option)}
                              className={`rounded-full border px-3 py-2 text-xs font-bold transition-all ${
                                active
                                  ? 'border-primary bg-primary-container text-white'
                                  : 'border-outline text-on-surface-variant hover:border-primary'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="text"
                        maxLength={500}
                        value={answer.extraWords ?? ''}
                        onChange={(event) =>
                          updateExtraWords(question.questionId, event.target.value)
                        }
                        placeholder="Add your own words"
                        className={`${inputClass} mt-3`}
                        aria-label={`${question.prompt} in your own words`}
                      />
                    </fieldset>
                  );
                })}
              </div>
              <textarea
                id="bio"
                ref={bioRef}
                rows={4}
                value={profile.bio}
                onChange={(event) => update({ bio: event.target.value })}
                placeholder="Your draft story will appear here as you answer the questions."
                className={inputClass}
              />
              {athleteEditedStory && generatedDraft ? (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <p className="text-xs font-semibold text-on-surface-variant">
                    Your story has edits, so chip changes will not overwrite it.
                  </p>
                  <button
                    type="button"
                    onClick={rewriteStory}
                    className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-all hover:border-secondary hover:text-secondary active:scale-95"
                  >
                    Rewrite from my answers
                  </button>
                </div>
              ) : null}
            </div>

            <div className="pt-4">
              <StepAdvance
                step={1}
                href={fromReview ? '/register/review' : '/register/athletics'}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-sm font-bold text-on-primary transition-all hover:bg-primary-strong active:scale-[0.98]"
              >
                {fromReview ? 'Save & return to review' : 'Next: Achievements'}
                <Icon name={fromReview ? 'check' : 'arrow-forward'} className="h-5 w-5" />
              </StepAdvance>
              <p className="mt-4 text-center text-xs text-tertiary">
                By continuing, you agree to Arc&rsquo;s{' '}
                <Link href="/terms" target="_blank" className="underline hover:text-primary">
                  Terms of Service
                </Link>
                .
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="label-bold text-on-surface" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}
