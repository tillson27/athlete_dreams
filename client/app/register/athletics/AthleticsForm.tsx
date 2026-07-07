'use client';

import Link from 'next/link';
import { Icon } from '../_components/Icon';
import { ProfilePreview } from '../_components/ProfilePreview';
import { useOnboarding, type PersonalBest } from '../_components/OnboardingContext';

const distances = ['5K', '10K', 'Half Marathon', 'Marathon', '50K', '100K', '100-miler', 'Other'];
const uid = () => Math.random().toString(36).slice(2, 9);

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-[#F8FAFC] p-3 text-base outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary';

export function AthleticsForm({ fromReview = false }: { fromReview?: boolean }) {
  const { profile, update } = useOnboarding();
  const bests = profile.personalBests;

  const setBests = (next: PersonalBest[]) => update({ personalBests: next });
  const addBest = () => setBests([...bests, { id: uid(), distance: '', time: '' }]);
  const patchBest = (id: string, patch: Partial<PersonalBest>) =>
    setBests(bests.map((best) => (best.id === id ? { ...best, ...patch } : best)));
  const removeBest = (id: string) => setBests(bests.filter((best) => best.id !== id));

  return (
    <div className="grid gap-10 md:grid-cols-2 md:items-start">
      {/* LIVE PREVIEW */}
      <div className="order-1">
        <ProfilePreview />
      </div>

      {/* FORM */}
      <div className="order-2 flex flex-col gap-8">
        <div>
          <span className="label-bold mb-2 block uppercase tracking-widest text-primary md:hidden">
            Step 2 of 4
          </span>
          <h2 className="mb-2 font-display text-4xl font-extrabold text-on-surface">
            Your results
          </h2>
          <p className="text-lg text-tertiary">
            Add a few personal bests — they show up as the highlights on your profile. You can add
            more later.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <Icon name="trophy" className="h-7 w-7 text-primary" />
            <h3 className="font-display text-2xl font-bold text-on-surface">Personal bests</h3>
          </div>

          {bests.length === 0 ? (
            <p className="rounded-lg border border-dashed border-outline-variant/60 p-4 text-center text-sm text-on-surface-variant">
              No personal bests yet — add your first below.
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
                        name="chevron-down"
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
                      <Icon name="delete" className="h-5 w-5" />
                    </button>
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

        <div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant/30 py-4 sm:flex-row">
          <Link
            href="/register/personal-basics"
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-outline px-8 py-4 font-bold text-on-surface-variant transition-all hover:bg-surface-container sm:w-auto"
          >
            <Icon name="arrow-back" className="h-5 w-5" />
            Back
          </Link>
          <Link
            href={fromReview ? '/register/review' : '/register/values-social'}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-12 py-4 font-display text-lg font-bold text-on-primary shadow-lg shadow-primary/20 transition-all hover:brightness-90 active:scale-95 sm:w-auto"
          >
            {fromReview ? 'Save & return to review' : 'Next: Values'}
            <Icon name={fromReview ? 'check' : 'arrow-forward'} className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}
