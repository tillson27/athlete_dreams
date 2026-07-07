'use client';

import Link from 'next/link';
import { Icon } from '../_components/Icon';
import { ProfilePreview } from '../_components/ProfilePreview';
import { useOnboarding } from '../_components/OnboardingContext';

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-[#F8FAFC] p-3 text-base outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary';

const sports = ['Road running', 'Trail & ultra', 'Track & field', 'Marathon', 'Other'];

export function PersonalBasicsForm() {
  const { profile, update } = useOnboarding();

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

        <form className="flex flex-col gap-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
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
                  name="chevron-down"
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
              rows={4}
              value={profile.bio}
              onChange={(event) => update({ bio: event.target.value })}
              placeholder="What got you started? What are you chasing? Write it in your own voice — we'll help you polish it later."
              className={inputClass}
            />
          </div>

          <div className="pt-4">
            <Link
              href="/register/athletics"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 text-sm font-bold uppercase tracking-[0.05em] text-on-primary transition-all hover:bg-[#832700] active:scale-[0.98]"
            >
              Next: Achievements
              <Icon name="arrow-forward" className="h-5 w-5" />
            </Link>
            <p className="mt-4 text-center text-xs text-tertiary">
              By continuing, you agree to Arc&rsquo;s{' '}
              <a href="#" className="underline hover:text-primary">
                Terms of Professional Conduct
              </a>
              .
            </p>
          </div>
        </form>

        <div className="flex items-start gap-4 rounded-xl border border-secondary/20 bg-secondary-container/10 p-6">
          <Icon name="shield-check" className="h-6 w-6 shrink-0 text-secondary" />
          <div>
            <h4 className="label-bold text-on-secondary-fixed-variant">Verified &amp; trusted</h4>
            <p className="mt-1 text-tertiary">
              Every ARC profile is verified before it goes live — so your story carries real weight.
            </p>
          </div>
        </div>
      </div>
    </div>
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
