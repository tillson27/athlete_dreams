'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { ProfilePreview } from '../_components/ProfilePreview';
import { EditReturnBanner } from '../_components/EditReturnBanner';
import { useOnboarding } from '../_components/OnboardingContext';
import { formInputClass as inputClass } from '@/components/ui/formStyles';


const sports = ['Road running', 'Trail & ultra'];

const storyPrompts = [
  { label: 'What got you started?', scaffold: 'What got me started: ' },
  { label: 'A race that changed you', scaffold: 'A race that changed me: ' },
  { label: "What you're chasing now", scaffold: "What I'm chasing now: " },
  { label: 'The hardest part', scaffold: 'The hardest part has been: ' },
  { label: "Who's in your corner", scaffold: 'In my corner: ' },
];

export function PersonalBasicsForm() {
  const fromReview = useSearchParams().get('from') === 'review';
  const { profile, update } = useOnboarding();
  const bioRef = useRef<HTMLTextAreaElement>(null);

  const insertPrompt = (scaffold: string) => {
    const current = profile.bio;
    if (current.includes(scaffold.trim())) {
      bioRef.current?.focus();
      return;
    }
    const separator = current.trim().length === 0 ? '' : current.endsWith('\n') ? '' : '\n\n';
    const next = `${current}${separator}${scaffold}`;
    update({ bio: next });
    requestAnimationFrame(() => {
      const element = bioRef.current;
      if (!element) return;
      element.focus();
      element.setSelectionRange(next.length, next.length);
    });
  };

  return (
    <>
      {fromReview ? <EditReturnBanner /> : null}
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        {/* LIVE PREVIEW */}
        <div className="order-1">
          <ProfilePreview />
        </div>

        {/* FORM */}
        <div className="order-2 flex flex-col gap-8">
          <div>
            <span className="eyebrow mb-2 block text-primary md:hidden">
              Step 1 of 4
            </span>
            <h2 className="mb-2 font-display text-4xl font-extrabold text-on-surface">
              Let&rsquo;s build your profile
            </h2>
            <p className="text-lg text-tertiary">
              Start with who you are and where you&rsquo;re headed. Watch it come together in the
              preview.
            </p>
          </div>

          <form className="flex flex-col gap-6 rounded-card border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
            <Field label="Your name" htmlFor="full_name">
              <input
                id="full_name"
                type="text"
                value={profile.name}
                onChange={(event) => update({ name: event.target.value })}
                placeholder="e.g. Cassandra de Winter"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Field label="Primary discipline" htmlFor="sport">
                <div className="relative">
                  <select
                    id="sport"
                    value={profile.discipline}
                    onChange={(event) => update({ discipline: event.target.value })}
                    className={`${inputClass} appearance-none pr-10 ${profile.discipline ? '' : 'text-tertiary'}`}
                  >
                    <option value="" disabled>
                      Select your discipline
                    </option>
                    {sports.map((option) => (
                      <option key={option} value={option} className="text-on-surface">
                        {option}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="chevron"
                    className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-tertiary"
                  />
                </div>
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
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="label-bold text-on-surface" htmlFor="bio">
                  Your story
                </label>
                <span className="text-xs text-tertiary">{profile.bio.length} characters</span>
              </div>
              <textarea
                id="bio"
                ref={bioRef}
                rows={4}
                value={profile.bio}
                onChange={(event) => update({ bio: event.target.value })}
                placeholder="What got you started? What are you chasing? Write it in your own voice — we'll help you polish it later."
                className={inputClass}
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-tertiary">Need a spark?</span>
                {storyPrompts.map((prompt) => (
                  <button
                    key={prompt.label}
                    type="button"
                    onClick={() => insertPrompt(prompt.scaffold)}
                    className="rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-all hover:border-secondary hover:text-secondary active:scale-95"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Link
                href={fromReview ? '/register/review' : '/register/athletics'}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-sm font-bold text-on-primary transition-all hover:bg-primary-strong active:scale-[0.98]"
              >
                {fromReview ? 'Save & return to review' : 'Next: Achievements'}
                <Icon name={fromReview ? 'check' : 'arrow-forward'} className="h-5 w-5" />
              </Link>
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
  children: React.ReactNode;
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
