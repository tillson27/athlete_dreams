'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { ProfilePreview } from '../_components/ProfilePreview';
import { EditReturnBanner } from '../_components/EditReturnBanner';
import { StepAdvance } from '../_components/StepAdvance';
import {
  useOnboarding,
  type PersonalBest,
  type CareerHighlight,
  type PreviousRace,
} from '../_components/OnboardingContext';
import { formInputClass as inputClass } from '@/components/ui/formStyles';
import { uid } from '@/lib/uid';

const distances = ['5K', '10K', 'Half Marathon', 'Marathon', '50K', '100K', '100-miler', 'Other'];


export function AthleticsForm() {
  const fromReview = useSearchParams().get('from') === 'review';
  const { profile, update } = useOnboarding();
  const bests = profile.personalBests;
  const highlights = profile.careerHighlights;
  const races = profile.previousRaces;

  const setBests = (mutate: (current: PersonalBest[]) => PersonalBest[]) =>
    update((current) => ({ personalBests: mutate(current.personalBests) }));
  const addBest = () => setBests((current) => [...current, { id: uid(), distance: '', time: '' }]);
  const patchBest = (id: string, patch: Partial<PersonalBest>) =>
    setBests((current) => current.map((best) => (best.id === id ? { ...best, ...patch } : best)));
  const removeBest = (id: string) => setBests((current) => current.filter((best) => best.id !== id));

  const setHighlights = (mutate: (current: CareerHighlight[]) => CareerHighlight[]) =>
    update((current) => ({ careerHighlights: mutate(current.careerHighlights) }));
  const addHighlight = () =>
    setHighlights((current) => [...current, { id: uid(), title: '', detail: '' }]);
  const patchHighlight = (id: string, patch: Partial<CareerHighlight>) =>
    setHighlights((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const removeHighlight = (id: string) =>
    setHighlights((current) => current.filter((item) => item.id !== id));

  const setRaces = (mutate: (current: PreviousRace[]) => PreviousRace[]) =>
    update((current) => ({ previousRaces: mutate(current.previousRaces) }));
  const addRace = () => setRaces((current) => [...current, { id: uid(), name: '', result: '' }]);
  const patchRace = (id: string, patch: Partial<PreviousRace>) =>
    setRaces((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const removeRace = (id: string) => setRaces((current) => current.filter((item) => item.id !== id));

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
              Step 2 of 4
            </span>
            <h2 className="mb-2 font-display text-2xl font-extrabold text-on-surface sm:text-3xl md:text-4xl">
              Step 2: Athletics &amp; Achievements
            </h2>
            <p className="text-lg text-tertiary">
              Add a few personal bests. They show up as the highlights on your profile. You can add
              more later.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-card border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Icon name="trophy" className="h-6 w-6 shrink-0 text-primary sm:h-7 sm:w-7" />
              <h3 className="font-display text-xl font-bold text-on-surface sm:text-2xl">Personal bests</h3>
              <span className="label-bold rounded-pill bg-error/10 px-2.5 py-1 text-xs text-error md:ml-auto">
                Required to publish
              </span>
            </div>

            {bests.length === 0 ? (
              <p className="rounded-lg border border-dashed border-outline-variant/60 p-4 text-center text-sm text-on-surface-variant">
                No personal bests yet. Add your first below.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {bests.map((best) => (
                  <div
                    key={best.id}
                    className="grid grid-cols-1 items-end gap-3 rounded-lg border border-outline-variant/20 bg-surface p-4 md:grid-cols-12"
                  >
                    <div className="flex flex-col gap-1.5 md:col-span-6">
                      <label className="label-bold text-on-surface-variant">Distance</label>
                      <div className="relative">
                        <select
                          value={best.distance}
                          onChange={(event) => patchBest(best.id, { distance: event.target.value })}
                          className={`${inputClass} appearance-none pr-10 ${best.distance ? '' : 'text-tertiary'}`}
                        >
                          <option value="" disabled>
                            Select distance
                          </option>
                          {distances.map((distance) => (
                            <option key={distance} value={distance} className="text-on-surface">
                              {distance}
                            </option>
                          ))}
                        </select>
                        <Icon
                          name="chevron"
                          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tertiary"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-5">
                      <label className="label-bold text-on-surface-variant">Time</label>
                      <input
                        type="text"
                        value={best.time}
                        onChange={(event) => patchBest(best.id, { time: event.target.value })}
                        placeholder="e.g. 2:34:43"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex justify-end pb-1 md:col-span-1 md:justify-center">
                      <button
                        type="button"
                        onClick={() => removeBest(best.id)}
                        aria-label="Remove personal best"
                        className="rounded-full p-2 text-error transition-colors hover:bg-error-container/30"
                      >
                        <Icon name="trash" className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-12">
                      <label className="label-bold text-on-surface-variant">
                        Results link <span className="font-normal text-tertiary">(optional)</span>
                      </label>
                      <input
                        type="url"
                        value={best.resultUrl ?? ''}
                        onChange={(event) => patchBest(best.id, { resultUrl: event.target.value })}
                        placeholder="Link to the official results page"
                        className={inputClass}
                      />
                      <p className="flex items-center gap-1.5 text-xs text-tertiary">
                        <Icon name="link" className="h-4 w-4 shrink-0 text-secondary" />
                        Add a link to the official race results and your profile links straight to
                        them.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addBest}
              className="flex items-center gap-2 self-start font-bold text-secondary hover:underline"
            >
              <Icon name="add-circle" className="h-5 w-5" />
              {bests.length === 0 ? 'Add your first personal best' : 'Add another'}
            </button>
          </div>

          <div className="flex items-start gap-3 rounded-card border border-dashed border-outline-variant bg-surface-container-low p-4">
            <Icon name="info" className="h-5 w-5 shrink-0 text-secondary" />
            <p className="text-sm text-on-surface-variant">
              Career highlights and previous races are optional. Add what you have now, or skip and
              fill them in anytime after your profile is created.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-card border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Icon name="medal" className="h-6 w-6 shrink-0 text-primary sm:h-7 sm:w-7" />
              <h3 className="font-display text-xl font-bold text-on-surface sm:text-2xl">Career highlights</h3>
              <span className="label-bold text-tertiary sm:ml-auto">Optional</span>
            </div>

            {highlights.length > 0 ? (
              <div className="flex flex-col gap-3">
                {highlights.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 items-end gap-3 rounded-lg border border-outline-variant/20 bg-surface p-4 md:grid-cols-12"
                  >
                    <div className="flex flex-col gap-1.5 md:col-span-6">
                      <label className="label-bold text-on-surface-variant">Highlight</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(event) => patchHighlight(item.id, { title: event.target.value })}
                        placeholder="e.g. Canadian Marathon Record"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-5">
                      <label className="label-bold text-on-surface-variant">Detail</label>
                      <input
                        type="text"
                        value={item.detail}
                        onChange={(event) => patchHighlight(item.id, { detail: event.target.value })}
                        placeholder="e.g. 2:24:11 at Toronto Waterfront, 2025"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex justify-end pb-1 md:col-span-1 md:justify-center">
                      <button
                        type="button"
                        onClick={() => removeHighlight(item.id)}
                        aria-label="Remove career highlight"
                        className="rounded-full p-2 text-error transition-colors hover:bg-error-container/30"
                      >
                        <Icon name="trash" className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-12">
                      <label className="label-bold text-on-surface-variant">
                        Results link <span className="font-normal text-tertiary">(optional)</span>
                      </label>
                      <input
                        type="url"
                        value={item.resultUrl ?? ''}
                        onChange={(event) => patchHighlight(item.id, { resultUrl: event.target.value })}
                        placeholder="Link to the official results page"
                        className={inputClass}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={addHighlight}
              className="flex items-center gap-2 self-start font-bold text-secondary hover:underline"
            >
              <Icon name="add-circle" className="h-5 w-5" />
              {highlights.length === 0 ? 'Add a career highlight' : 'Add another'}
            </button>
          </div>

          <div className="flex flex-col gap-4 rounded-card border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Icon name="flag" className="h-6 w-6 shrink-0 text-primary sm:h-7 sm:w-7" />
              <h3 className="font-display text-xl font-bold text-on-surface sm:text-2xl">Previous races</h3>
              <span className="label-bold text-tertiary sm:ml-auto">Optional</span>
            </div>

            {races.length > 0 ? (
              <div className="flex flex-col gap-3">
                {races.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 items-end gap-3 rounded-lg border border-outline-variant/20 bg-surface p-4 md:grid-cols-12"
                  >
                    <div className="flex flex-col gap-1.5 md:col-span-6">
                      <label className="label-bold text-on-surface-variant">Race</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(event) => patchRace(item.id, { name: event.target.value })}
                        placeholder="e.g. Boston Marathon 2026"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-5">
                      <label className="label-bold text-on-surface-variant">Result</label>
                      <input
                        type="text"
                        value={item.result}
                        onChange={(event) => patchRace(item.id, { result: event.target.value })}
                        placeholder="e.g. 1st Female, 2:34:43"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex justify-end pb-1 md:col-span-1 md:justify-center">
                      <button
                        type="button"
                        onClick={() => removeRace(item.id)}
                        aria-label="Remove previous race"
                        className="rounded-full p-2 text-error transition-colors hover:bg-error-container/30"
                      >
                        <Icon name="trash" className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-12">
                      <label className="label-bold text-on-surface-variant">
                        Results link <span className="font-normal text-tertiary">(optional)</span>
                      </label>
                      <input
                        type="url"
                        value={item.resultUrl ?? ''}
                        onChange={(event) => patchRace(item.id, { resultUrl: event.target.value })}
                        placeholder="Link to the official results page"
                        className={inputClass}
                      />
                      <p className="flex items-center gap-1.5 text-xs text-tertiary">
                        <Icon name="link" className="h-4 w-4 shrink-0 text-secondary" />
                        Link the official results and your profile links straight to them.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={addRace}
              className="flex items-center gap-2 self-start font-bold text-secondary hover:underline"
            >
              <Icon name="add-circle" className="h-5 w-5" />
              {races.length === 0 ? 'Add a previous race' : 'Add another'}
            </button>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/30 py-4 sm:flex-row">
            <Link
              href="/register/personal-basics"
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-outline px-8 py-4 font-bold text-on-surface-variant transition-all hover:bg-surface-container sm:w-auto"
            >
              <Icon name="arrow-back" className="h-5 w-5" />
              Back
            </Link>
            <StepAdvance
              step={2}
              href={fromReview ? '/register/review' : '/register/values-social'}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-12 py-4 font-display text-lg font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:brightness-90 active:scale-95 sm:w-auto"
            >
              {fromReview ? 'Save & return to review' : 'Next: Values'}
              <Icon name={fromReview ? 'check' : 'arrow-forward'} className="h-6 w-6" />
            </StepAdvance>
          </div>
        </div>
      </div>
    </>
  );
}
