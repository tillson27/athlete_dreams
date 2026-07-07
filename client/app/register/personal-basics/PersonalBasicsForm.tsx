'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '../_components/Icon';

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-[#F8FAFC] p-3 text-base outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary';

const sports = ['Road running', 'Trail & ultra', 'Track & field', 'Marathon', 'Other'];

const previewPhoto =
  'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=1000&q=70';

export function PersonalBasicsForm() {
  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'your-name';

  return (
    <div className="grid gap-10 md:grid-cols-2 md:items-start">
      {/* LIVE PREVIEW — assembles as you type */}
      <div className="order-1 md:sticky md:top-24">
        <p className="label-bold mb-3 flex items-center gap-2 text-primary">
          <Sparkle className="h-4 w-4" />
          Live preview
        </p>
        <div className="overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-container-lowest shadow-2xl">
          {/* browser chrome */}
          <div className="flex items-center gap-2 border-b border-outline-variant bg-surface-container px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-error/70" />
            <span className="h-3 w-3 rounded-full bg-primary-container/70" />
            <span className="h-3 w-3 rounded-full bg-success/70" />
            <span className="ml-3 flex-1 truncate rounded-pill bg-surface px-3 py-1 text-xs text-on-surface-variant">
              arc.network/athletes/{slug}
            </span>
          </div>
          {/* hero */}
          <div className="relative h-60">
            <Image src={previewPhoto} alt="" fill sizes="(max-width: 768px) 100vw, 500px" className="object-cover" />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#140b08]/90 via-[#160d09]/25 to-transparent"
            />
            <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
              <span className="mb-2 inline-flex items-center gap-1 rounded-pill bg-success px-2.5 py-1 text-[11px] font-bold tracking-[0.05em]">
                <Icon name="check" className="h-3.5 w-3.5" />
                Verified Athlete
              </span>
              <h3
                className={`font-display text-2xl font-extrabold leading-tight drop-shadow-sm ${
                  name ? 'text-white' : 'text-white/50'
                }`}
              >
                {name || 'Your name'}
              </h3>
              <p className="label-bold mt-1 text-white/90">
                <span className={sport ? '' : 'text-white/50'}>{sport || 'Your sport'}</span>
                {' · '}
                <span className={location ? '' : 'text-white/50'}>{location || 'Your city'}</span>
              </p>
            </div>
          </div>
          {/* about */}
          <div className="p-5">
            <p className="label-bold text-on-surface-variant">About</p>
            <p
              className={`mt-1 text-sm leading-relaxed ${
                bio ? 'text-on-surface' : 'italic text-on-surface-variant/60'
              }`}
            >
              {bio || 'Your story will appear here as you write it.'}
            </p>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-on-surface-variant">
          This is your public profile — it updates as you type.
        </p>
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
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Cassandra de Winter"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Primary discipline" htmlFor="sport">
              <div className="relative">
                <select
                  id="sport"
                  value={sport}
                  onChange={(event) => setSport(event.target.value)}
                  className={`${inputClass} appearance-none pr-10 ${sport ? '' : 'text-tertiary'}`}
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
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
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
              <span className="text-xs text-tertiary">{bio.length} characters</span>
            </div>
            <textarea
              id="bio"
              rows={4}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
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

        {/* Trust indicator */}
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

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2L12 2Zm7 10 1 2.6L22.6 16 20 17l-1 2.6L18 17l-2.6-1L18 14.6 19 12Z" />
    </svg>
  );
}
