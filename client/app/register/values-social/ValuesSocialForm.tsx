'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { ProfilePreview } from '../_components/ProfilePreview';
import { EditReturnBanner } from '../_components/EditReturnBanner';
import { StepAdvance } from '../_components/StepAdvance';
import { useOnboarding } from '../_components/OnboardingContext';
import { formInputClass as inputClass } from '@/components/ui/formStyles';

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
const MAX_VALUES = 5;
const MAX_VALUE_LENGTH = 40;

export function ValuesSocialForm() {
  const fromReview = useSearchParams().get('from') === 'review';
  const { profile, update } = useOnboarding();
  const [customValue, setCustomValue] = useState('');
  const [valueHint, setValueHint] = useState<string | null>(null);

  const toggleValue = (value: string) => {
    setValueHint(null);
    update((current) => {
      if (current.values.includes(value)) {
        return { values: current.values.filter((entry) => entry !== value) };
      }
      if (current.values.length < MAX_VALUES) {
        return { values: [...current.values, value] };
      }
      setValueHint(`Pick up to ${MAX_VALUES} values.`);
      return {};
    });
  };

  const removeValue = (value: string) => {
    setValueHint(null);
    update((current) => ({ values: current.values.filter((entry) => entry !== value) }));
  };

  const addCustomValue = () => {
    const value = customValue.trim().slice(0, MAX_VALUE_LENGTH);
    if (!value) return;
    setValueHint(null);
    update((current) => {
      const alreadyChosen = current.values.some(
        (entry) => entry.toLowerCase() === value.toLowerCase()
      );
      if (alreadyChosen) {
        setValueHint('That value is already selected.');
        return {};
      }
      if (current.values.length >= MAX_VALUES) {
        setValueHint(`Pick up to ${MAX_VALUES} values.`);
        return {};
      }
      setCustomValue('');
      return { values: [...current.values, value] };
    });
  };

  const customSelectedValues = profile.values.filter((value) => !VALUES.includes(value));

  return (
    <>
      {fromReview ? <EditReturnBanner /> : null}
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        {/* LIVE PREVIEW */}
        <div className="order-2 md:order-1">
          <ProfilePreview />
        </div>

        {/* FORM */}
        <div className="order-1 flex flex-col gap-10 md:order-2">
          <section>
            <span className="eyebrow mb-2 block text-on-surface md:hidden">
              Step 3 of 4
            </span>
            <h1 className="mb-2 font-display text-2xl font-extrabold text-on-surface sm:text-3xl md:text-4xl">
              Step 3: Values &amp; Voice
            </h1>
            <p className="text-lg text-on-surface-variant">
              What you stand for, in your own words: the values and voice behind your story.
            </p>
          </section>

          <section>
            <label className="label-bold mb-3 block text-on-surface">
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
              {customSelectedValues.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed="true"
                  onClick={() => removeValue(value)}
                  className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary-container px-5 py-2.5 font-bold text-white transition-all hover:border-error"
                >
                  {value}
                  <Icon name="close" className="h-4 w-4" />
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-input border border-outline-variant bg-surface-container-lowest p-4">
              <label className="label-bold text-on-surface" htmlFor="custom_value">
                Add your own value
              </label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    id="custom_value"
                    type="text"
                    maxLength={MAX_VALUE_LENGTH}
                    value={customValue}
                    onChange={(event) => {
                      setCustomValue(event.target.value);
                      setValueHint(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return;
                      event.preventDefault();
                      addCustomValue();
                    }}
                    placeholder="e.g. Courage"
                    className={`${inputClass} pr-16`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/50">
                    {customValue.length}/{MAX_VALUE_LENGTH}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addCustomValue}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-2 text-sm font-bold text-on-secondary transition-all hover:bg-secondary/90"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add
                </button>
              </div>
              {valueHint ? (
                <p className="mt-2 text-sm font-semibold text-error">{valueHint}</p>
              ) : (
                <p className="mt-2 text-xs text-on-surface-variant">
                  Selected values can be preset or your own words.
                </p>
              )}
            </div>
          </section>

          <section>
            <label
              className="label-bold mb-2 flex flex-wrap items-center gap-2 text-on-surface"
              htmlFor="mission"
            >
              Your tagline
              <span className="rounded-pill bg-error/10 px-2.5 py-1 text-xs text-error">
                Required to publish
              </span>
            </label>
            <div className="relative">
              <input
                id="mission"
                type="text"
                maxLength={100}
                value={profile.mission}
                onChange={(event) => update({ mission: event.target.value })}
                placeholder="e.g. Chasing sunrises and sub-3 marathons."
                className="w-full rounded-input border border-outline-variant bg-surface-container-low px-4 py-4 outline-none transition-all focus:border-focus focus:ring-2 focus:ring-focus/20"
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
            <StepAdvance
              step={3}
              href="/register/review"
              className="w-full rounded-lg bg-primary px-12 py-4 text-center font-bold text-white shadow-lg transition-all hover:bg-primary-strong active:scale-95 sm:w-auto"
            >
              {fromReview ? 'Save & return to review' : 'Next: Final Review'}
            </StepAdvance>
          </div>
        </div>
      </div>
    </>
  );
}
