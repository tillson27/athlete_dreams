'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { loadEdits, subscribeToEdits, type AthleteEdits, type EditRace } from '@/lib/athleteEdits';
import { HighlightDropdown, RaceDropdown } from './profileParts';
import { Icon } from '@/components/ui/Icon';
import { PhotoCarousel } from '@/components/ui/PhotoCarousel';
import { DATA_SOURCE } from '@/lib/dataSource';
import { unsplashPhoto } from '@/lib/unsplash';

// Renders published `defaults` during SSR and until mounted, then swaps in any
// saved edits for this athlete (reactive to saves from the manage editor).
function useAthleteEdits(slug: string, defaults: AthleteEdits): AthleteEdits {
  const [edits, setEdits] = useState<AthleteEdits>(defaults);

  useEffect(() => {
    if (DATA_SOURCE !== 'mock') {
      setEdits(defaults);
      return;
    }
    const sync = () => setEdits(loadEdits(slug) ?? defaults);
    sync();
    return subscribeToEdits(slug, sync);
    // defaults is derived fresh each render; slug identifies the athlete.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return edits;
}

const HIGHLIGHTS_VISIBLE = 2;
const RACES_VISIBLE = 3;
const toneFor = (index: number): 'primary' | 'secondary' =>
  index % 2 === 0 ? 'secondary' : 'primary';

const raceLinks = (race: EditRace): { label: string; href: string }[] | undefined => {
  // Older saved edits stored links as plain strings; only keep well-formed entries.
  const links = (race.links ?? []).filter(
    (link): link is { label: string; href: string } =>
      typeof link === 'object' && link !== null && Boolean(link.href),
  );
  if (race.resultsUrl) links.push({ label: 'Results', href: race.resultsUrl });
  return links.length > 0 ? links : undefined;
};

export function EditedHighlights({
  slug,
  defaults,
  moreLabel,
}: {
  slug: string;
  defaults: AthleteEdits;
  moreLabel: string;
}) {
  const { highlights } = useAthleteEdits(slug, defaults);
  const [showAllHighlights, setShowAllHighlights] = useState(false);
  const visible = highlights.slice(0, HIGHLIGHTS_VISIBLE);
  const rest = highlights.slice(HIGHLIGHTS_VISIBLE);
  const displayedHighlights = showAllHighlights ? highlights : visible;

  if (highlights.length === 0) {
    return <EmptySection label="Career highlights coming soon." />;
  }

  return (
    <div className="mt-6 space-y-4">
      {displayedHighlights.map((highlight, index) => (
        <HighlightDropdown
          key={highlight.id}
          title={highlight.title}
          detail={highlight.detail}
          tone={toneFor(index)}
          images={highlight.photos}
        />
      ))}
      {rest.length > 0 ? (
        <button
          type="button"
          aria-expanded={showAllHighlights}
          className="label-bold flex w-full items-center justify-center gap-2 py-3 text-on-surface hover:underline"
          onClick={() => setShowAllHighlights((current) => !current)}
        >
          {showAllHighlights ? 'Show fewer' : moreLabel}
          <Icon
            name="chevron"
            className={`h-5 w-5 transition-transform ${showAllHighlights ? 'rotate-180' : ''}`}
          />
        </button>
      ) : null}
    </div>
  );
}

export function EditedRaces({
  slug,
  defaults,
  moreLabel,
}: {
  slug: string;
  defaults: AthleteEdits;
  moreLabel: string;
}) {
  const { races } = useAthleteEdits(slug, defaults);
  const [showAllRaces, setShowAllRaces] = useState(false);
  const visible = races.slice(0, RACES_VISIBLE);
  const rest = races.slice(RACES_VISIBLE);
  const displayedRaces = showAllRaces ? races : visible;

  if (races.length === 0) {
    return <EmptySection label="Previous races coming soon." />;
  }

  return (
    <div className="mt-6 space-y-6">
      {displayedRaces.map((race, index) => (
        <RaceDropdown
          key={race.id}
          name={race.name}
          date={race.date}
          result={race.result}
          tone={toneFor(index)}
          links={raceLinks(race)}
          images={race.photos}
        />
      ))}
      {rest.length > 0 ? (
        <button
          type="button"
          aria-expanded={showAllRaces}
          className="label-bold flex w-full items-center justify-center gap-2 py-3 text-on-surface hover:underline"
          onClick={() => setShowAllRaces((current) => !current)}
        >
          {showAllRaces ? 'Show fewer' : moreLabel}
          <Icon
            name="chevron"
            className={`h-5 w-5 transition-transform ${showAllRaces ? 'rotate-180' : ''}`}
          />
        </button>
      ) : null}
    </div>
  );
}

export function EditedRoadmap({ slug, defaults }: { slug: string; defaults: AthleteEdits }) {
  const { roadmap } = useAthleteEdits(slug, defaults);
  if (roadmap.length === 0) {
    return <EmptySection label="Race roadmap coming soon." compact />;
  }
  return (
    <div className="space-y-6">
      {roadmap.map((event) => (
        <div key={event.id}>
          <p className="label-bold text-on-surface">{event.name}</p>
          <p className="text-xs text-on-surface-variant">{event.date}</p>
        </div>
      ))}
    </div>
  );
}

export function EditedGallery({ slug, defaults }: { slug: string; defaults: AthleteEdits }) {
  const { gallery } = useAthleteEdits(slug, defaults);
  const [openIndex, setOpenIndex] = useState(-1);

  if (gallery.length === 0) {
    return <EmptySection label="Photo gallery coming soon." compact />;
  }

  const photos = gallery.map((photo, index) => ({
    id: photo,
    src: unsplashPhoto(photo, 1200),
    alt: `Gallery photo ${index + 1}`,
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            className="relative aspect-square overflow-hidden rounded bg-surface-container transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
            onClick={() => setOpenIndex(index)}
          >
            <Image
              src={unsplashPhoto(photo.id, 400)}
              alt={photo.alt}
              fill
              unoptimized
              sizes="200px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
      <PhotoCarousel photos={photos} openIndex={openIndex} onClose={() => setOpenIndex(-1)} />
    </>
  );
}

function EmptySection({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div
      className={`rounded-input border border-dashed border-outline-variant bg-surface-container-low/50 text-sm font-semibold text-on-surface-variant ${
        compact ? 'p-4' : 'mt-6 p-5'
      }`}
    >
      {label}
    </div>
  );
}
