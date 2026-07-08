'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { loadEdits, subscribeToEdits, type AthleteEdits, type EditRace } from '@/lib/athleteEdits';
import { HighlightDropdown, RaceDropdown, Icon, img } from './profileParts';

// Renders published `defaults` during SSR and until mounted, then swaps in any
// saved edits for this athlete (reactive to saves from the manage editor).
function useAthleteEdits(slug: string, defaults: AthleteEdits): AthleteEdits {
  const [edits, setEdits] = useState<AthleteEdits>(defaults);

  useEffect(() => {
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

const raceLinks = (race: EditRace): string[] | undefined => {
  const links = [...(race.links ?? [])];
  if (race.resultsUrl) links.push('Results');
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
  const visible = highlights.slice(0, HIGHLIGHTS_VISIBLE);
  const rest = highlights.slice(HIGHLIGHTS_VISIBLE);

  return (
    <div className="mt-6 space-y-4">
      {visible.map((highlight, index) => (
        <HighlightDropdown
          key={highlight.id}
          title={highlight.title}
          detail={highlight.detail}
          tone={toneFor(index)}
          images={highlight.photos}
        />
      ))}
      {rest.length > 0 ? (
        <details className="group">
          <summary className="label-bold flex cursor-pointer list-none items-center justify-center gap-2 py-3 text-primary hover:underline">
            {moreLabel}
            <Icon name="chevron" className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-4">
            {rest.map((highlight) => (
              <HighlightDropdown
                key={highlight.id}
                title={highlight.title}
                detail={highlight.detail}
                tone="primary"
                images={highlight.photos}
              />
            ))}
          </div>
        </details>
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
  const visible = races.slice(0, RACES_VISIBLE);
  const rest = races.slice(RACES_VISIBLE);

  return (
    <div className="mt-6 space-y-6">
      {visible.map((race, index) => (
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
        <details className="group mt-2">
          <summary className="label-bold flex cursor-pointer list-none items-center justify-center gap-2 py-3 text-primary hover:underline">
            {moreLabel}
            <Icon name="chevron" className="h-5 w-5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-6">
            {rest.map((race) => (
              <RaceDropdown
                key={race.id}
                name={race.name}
                date={race.date}
                result={race.result}
                tone="primary"
                links={raceLinks(race)}
                images={race.photos}
              />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

export function EditedRoadmap({ slug, defaults }: { slug: string; defaults: AthleteEdits }) {
  const { roadmap } = useAthleteEdits(slug, defaults);
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
  return (
    <div className="grid grid-cols-2 gap-2">
      {gallery.map((photo, index) => (
        <div
          key={photo}
          className="relative aspect-square cursor-pointer overflow-hidden rounded transition-opacity hover:opacity-90"
        >
          <Image
            src={img(photo, 400)}
            alt={`Gallery photo ${index + 1}`}
            fill
            unoptimized
            sizes="200px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
