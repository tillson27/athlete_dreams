'use client';

import Image from 'next/image';
import { Icon } from '@/components/ui/Icon';
import { useOnboarding } from './OnboardingContext';
import { useSession } from '@/lib/session';
import { slugifyName } from '@/lib/slugify';
import { profileUrl } from '@/lib/profileUrl';

const previewPhoto =
  'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=1000&q=70';

export function ProfilePreview({
  sticky = true,
  showMeta = true,
}: {
  sticky?: boolean;
  showMeta?: boolean;
}) {
  const { profile, mode, draftSlug } = useOnboarding();
  const { session } = useSession();
  const { location, bio, mission, values, personalBests, careerHighlights, previousRaces } =
    profile;
  const name = profile.name || session?.name || '';
  const slug = (mode === 'api' ? draftSlug : null) ?? (slugifyName(name) || 'your-name');
  const filledBests = personalBests.filter((best) => best.distance && best.time).slice(0, 3);
  const filledHighlights = careerHighlights.filter((item) => item.title.trim()).slice(0, 4);
  const filledRaces = previousRaces.filter((item) => item.name.trim()).slice(0, 4);

  return (
    <div className={sticky ? 'md:sticky md:top-24' : ''}>
      {showMeta ? (
        <p className="label-bold mb-3 flex items-center gap-2 text-primary">
          <Sparkle className="h-4 w-4" />
          Live preview
        </p>
      ) : null}
      <div className="overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-container-lowest shadow-2xl">
        {/* browser chrome */}
        <div className="flex items-center gap-2 border-b border-outline-variant bg-surface-container px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-error/70" />
          <span className="h-3 w-3 rounded-full bg-primary-container/70" />
          <span className="h-3 w-3 rounded-full bg-success/70" />
          <span className="ml-3 flex-1 truncate rounded-pill bg-surface px-3 py-1 text-xs text-on-surface-variant">
            {profileUrl(slug)}
          </span>
        </div>
        {/* hero */}
        <div className="relative h-56 bg-surface-container">
          <Image src={previewPhoto} alt="" fill sizes="(max-width: 768px) 100vw, 500px" className="object-cover" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#140b08]/90 via-[#160d09]/25 to-transparent"
          />
          <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <h3
              className={`font-display text-2xl font-extrabold leading-tight drop-shadow-sm ${
                name ? 'text-white' : 'text-white/50'
              }`}
            >
              {name || 'Your name'}
            </h3>
            <p className="label-bold mt-1 text-white/90">
              <span className={location ? '' : 'text-white/50'}>{location || 'Your city'}</span>
            </p>
          </div>
        </div>
        {/* body — grows as you complete steps */}
        <div className="space-y-4 p-5">
          {mission ? (
            <p className="border-l-4 border-primary pl-3 text-sm italic text-on-surface">
              &ldquo;{mission}&rdquo;
            </p>
          ) : null}

          <div>
            <p className="label-bold text-on-surface-variant">About</p>
            <p
              className={`mt-1 text-sm leading-relaxed ${
                bio ? 'text-on-surface' : 'italic text-on-surface-variant/60'
              }`}
            >
              {bio || 'Your story will appear here as you write it.'}
            </p>
          </div>

          {filledBests.length > 0 ? (
            <div>
              <p className="label-bold text-on-surface-variant">Personal bests</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {filledBests.map((best) => (
                  <div key={best.id} className="rounded-input bg-surface-container-low p-2.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                        {best.distance}
                      </p>
                      {best.resultUrl ? (
                        <span
                          className="inline-flex text-success"
                          title="Verified result"
                          aria-label="Verified result"
                        >
                          <Icon name="verified" className="h-3.5 w-3.5 shrink-0" />
                        </span>
                      ) : null}
                    </div>
                    <p className="font-display text-sm font-bold text-on-surface">{best.time}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {filledHighlights.length > 0 ? (
            <div>
              <p className="label-bold text-on-surface-variant">Career highlights</p>
              <ul className="mt-2 space-y-1.5">
                {filledHighlights.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <Icon name="medal" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="flex-1">
                      <span className="font-bold text-on-surface">{item.title}</span>
                      {item.detail ? (
                        <span className="text-on-surface-variant"> — {item.detail}</span>
                      ) : null}
                    </span>
                    {item.resultUrl ? (
                      <span
                        className="mt-0.5 inline-flex shrink-0 text-success"
                        title="Verified result"
                        aria-label="Verified result"
                      >
                        <Icon name="verified" className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {filledRaces.length > 0 ? (
            <div>
              <p className="label-bold text-on-surface-variant">Previous races</p>
              <ul className="mt-2 space-y-1.5">
                {filledRaces.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <Icon name="flag" className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                    <span className="flex-1">
                      <span className="font-bold text-on-surface">{item.name}</span>
                      {item.result ? (
                        <span className="text-on-surface-variant"> — {item.result}</span>
                      ) : null}
                    </span>
                    {item.resultUrl ? (
                      <span
                        className="mt-0.5 inline-flex shrink-0 text-success"
                        title="Verified result"
                        aria-label="Verified result"
                      >
                        <Icon name="verified" className="h-3.5 w-3.5" />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {values.length > 0 ? (
            <div>
              <p className="label-bold text-on-surface-variant">Values</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {values.map((value) => (
                  <span
                    key={value}
                    className="rounded-pill bg-secondary-soft px-3 py-1 text-xs font-bold text-secondary"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {showMeta ? (
        <p className="mt-3 text-center text-xs text-on-surface-variant">
          Your public profile — it fills in as you go.
        </p>
      ) : null}
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
