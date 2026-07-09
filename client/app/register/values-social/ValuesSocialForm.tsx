'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { ProfilePreview } from '../_components/ProfilePreview';
import { useOnboarding } from '../_components/OnboardingContext';

const VALUES = [
  'Grit',
  'Community',
  'Consistency',
  'Resilience',
  'Discipline',
  'Hard work',
  'Perseverance',
  'Joy',
  'Sustainability',
  'Family',
  'Adventure',
  'Mental toughness',
];
const MAX_VALUES = 3;

export function ValuesSocialForm({ fromReview = false }: { fromReview?: boolean }) {
  const { profile, update } = useOnboarding();

  const toggleValue = (value: string) => {
    update((current) => {
      if (current.values.includes(value)) {
        return { values: current.values.filter((entry) => entry !== value) };
      }
      if (current.values.length < MAX_VALUES) {
        return { values: [...current.values, value] };
      }
      return {};
    });
  };

  return (
    <div className="grid gap-10 md:grid-cols-2 md:items-start">
      {/* LIVE PREVIEW */}
      <div className="order-1">
        <ProfilePreview />
      </div>

      {/* FORM */}
      <div className="order-2 flex flex-col gap-10">
        <section>
          <span className="eyebrow mb-2 block text-primary md:hidden">
            Step 3 of 4
          </span>
          <h1 className="mb-2 font-display text-4xl font-extrabold text-on-surface">
            Values &amp; voice
          </h1>
          <p className="text-lg text-on-surface-variant">
            What you stand for, in your own words — the values and voice behind your story.
          </p>
        </section>

        <section>
          <label className="label-bold mb-3 block text-primary">
            Your values (pick up to {MAX_VALUES})
          </label>
          <div className="flex flex-wrap gap-3">
            {VALUES.map((value) => {
              const active = profile.values.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleValue(value)}
                  className={`rounded-full border px-5 py-2.5 font-bold transition-all ${
                    active
                      ? 'border-primary bg-primary-container text-white'
                      : 'border-outline text-on-surface-variant hover:border-primary'
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <label className="label-bold mb-2 block text-primary" htmlFor="mission">
            Your tagline
          </label>
          <div className="relative">
            <input
              id="mission"
              type="text"
              maxLength={100}
              value={profile.mission}
              onChange={(event) => update({ mission: event.target.value })}
              placeholder="e.g. Chasing sunrises and sub-3 marathons."
              className="w-full rounded-input border border-outline-variant bg-surface-container-low px-4 py-4 outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/50">
              {profile.mission.length}/100
            </span>
          </div>
        </section>

        <div className="mt-2 flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant pt-8 sm:flex-row">
          <Link
            href="/register/athletics"
            className="flex items-center gap-2 font-bold text-secondary transition-all hover:underline"
          >
            <Icon name="arrow-back" className="h-5 w-5" />
            Back
          </Link>
          <Link
            href="/register/review"
            className="w-full rounded-lg bg-primary px-12 py-4 text-center font-bold text-white shadow-lg transition-all hover:bg-primary-strong active:scale-95 sm:w-auto"
          >
            {fromReview ? 'Save & return to review' : 'Next: Final Review'}
          </Link>
        </div>
      </div>
    </div>
  );
}
