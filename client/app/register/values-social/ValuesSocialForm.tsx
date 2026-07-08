'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/Icon';
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

type Connection = {
  name: string;
  description: string;
  icon?: IconName;
  iconWrap: string;
  iconColor: string;
  connectedHandle?: string;
};

const connections: Connection[] = [
  {
    name: 'Strava',
    description: 'Import training stats and verified results.',
    icon: 'run',
    iconWrap: 'bg-[#ffdbcf]',
    iconColor: 'text-[#FC6100]',
  },
  {
    name: 'Instagram',
    description: 'Show your day-to-day running life.',
    icon: 'camera',
    iconWrap: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
    iconColor: 'text-white',
    connectedHandle: '@you',
  },
  {
    name: 'Garmin / Coros',
    description: 'Sync workouts and technical metrics.',
    icon: 'watch',
    iconWrap: 'bg-surface-container-high',
    iconColor: 'text-on-surface-variant',
  },
];

export function ValuesSocialForm({ fromReview = false }: { fromReview?: boolean }) {
  const { profile, update } = useOnboarding();
  const [connected, setConnected] = useState<string[]>([]);

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
            What you stand for and connections that make your story real.
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

        <section className="flex w-full flex-col gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-on-surface">Connect your journey</h2>
            <p className="mt-1 text-on-surface-variant">
              Link your platforms so your training and results stay verified.
            </p>
          </div>
          <div className="flex w-full flex-col gap-4">
            {connections.map((connection) => (
              <div
                key={connection.name}
                className="flex items-center justify-between rounded-card border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-lg ${connection.iconWrap}`}
                  >
                    {connection.icon ? (
                      <Icon name={connection.icon} className={`h-7 w-7 ${connection.iconColor}`} />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="label-bold text-on-surface">{connection.name}</h3>
                    <p className="text-sm text-on-surface-variant">{connection.description}</p>
                  </div>
                </div>
                {connection.connectedHandle || connected.includes(connection.name) ? (
                  <div className="flex items-center gap-2 rounded-full bg-surface-container px-4 py-2 text-sm font-bold text-on-surface">
                    <Icon name="check" className="h-4 w-4" />
                    <span>{connection.connectedHandle ?? 'Connected'}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConnected((prev) => [...prev, connection.name])}
                    className="rounded-pill border border-outline px-6 py-2 font-bold text-secondary transition-colors hover:bg-surface-container-low"
                  >
                    Connect
                  </button>
                )}
              </div>
            ))}
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
