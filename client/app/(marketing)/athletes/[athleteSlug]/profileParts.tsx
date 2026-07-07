import Image from 'next/image';

// Shared presentational pieces for the athlete profile. Pure (no hooks / client
// APIs) so both the server profile and the client editable sections can use them.

export const img = (id: string, width = 800) =>
  id.startsWith('http')
    ? id
    : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;

export function HighlightDropdown({
  title,
  detail,
  tone,
  images,
}: {
  title: string;
  detail: string;
  tone: 'primary' | 'secondary';
  images: string[];
}) {
  const accent =
    tone === 'secondary'
      ? 'border-secondary-soft bg-secondary-soft/30 text-secondary'
      : 'border-outline-variant bg-surface-container-low text-primary';
  const chip = tone === 'secondary' ? 'bg-secondary text-white' : 'bg-primary text-white';

  return (
    <details className="group">
      <summary
        className={`flex cursor-pointer list-none items-center justify-between rounded-input border p-4 transition-colors ${accent}`}
      >
        <div className="flex gap-4">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${chip}`}>
            <Icon name="medal" className="h-5 w-5" />
          </span>
          <div>
            <p className="label-bold text-on-surface">{title}</p>
            <p className="text-xs text-on-surface-variant">{detail}</p>
          </div>
        </div>
        <Icon name="chevron" className="h-5 w-5 transition-transform group-open:rotate-180" />
      </summary>
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 rounded-b-input border-x border-b border-outline-variant bg-surface-container-low/40 p-4">
          {images.map((image, index) => (
            <div
              key={`${title}-${index}`}
              className="relative aspect-[3/4] overflow-hidden rounded-input"
            >
              <Image
                src={img(image, 500)}
                alt={`${title} photo ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, 300px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </details>
  );
}

export function RaceDropdown({
  name,
  date,
  result,
  tone,
  links,
  images,
}: {
  name: string;
  date: string;
  result: string;
  tone: 'primary' | 'secondary';
  links?: string[];
  images: string[];
}) {
  const accent = tone === 'secondary' ? 'border-secondary' : 'border-primary';

  return (
    <details className="group">
      <summary
        className={`flex cursor-pointer list-none items-start justify-between rounded-r-input border-l-4 bg-surface-container-low/40 p-5 transition-colors hover:bg-surface-container-low/60 ${accent}`}
      >
        <div className="flex-1">
          <h4 className="text-lg font-bold text-on-surface">{name}</h4>
          <p className="text-xs text-on-surface-variant">
            {date} • {result}
          </p>
        </div>
        <Icon
          name="chevron"
          className={`h-5 w-5 transition-transform group-open:rotate-180 ${
            tone === 'secondary' ? 'text-secondary' : 'text-primary'
          }`}
        />
      </summary>
      <div className={`space-y-4 rounded-br-input border-l-4 bg-surface-container-low/20 p-5 ${accent}`}>
        {links && links.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {links.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 text-xs font-bold text-secondary"
              >
                <Icon name="link" className="h-4 w-4" />
                {label}
              </span>
            ))}
          </div>
        ) : null}
        {images.length > 0 ? (
          <div className={images.length > 1 ? 'grid grid-cols-2 gap-2' : 'overflow-hidden rounded-input'}>
            {images.map((image, index) => (
              <div
                key={`${name}-${index}`}
                className={`relative overflow-hidden rounded-input ${
                  images.length > 1 ? 'aspect-[4/5]' : 'aspect-[16/9]'
                }`}
              >
                <Image
                  src={img(image, 900)}
                  alt={`${name} photo ${index + 1}`}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </details>
  );
}

export type IconName =
  | 'check'
  | 'trail'
  | 'location'
  | 'shield'
  | 'play'
  | 'book'
  | 'timer'
  | 'medal'
  | 'trophy'
  | 'history'
  | 'diamond'
  | 'groups'
  | 'person'
  | 'person-add'
  | 'gallery'
  | 'instagram'
  | 'heart'
  | 'chevron'
  | 'link'
  | 'external'
  | 'edit'
  | 'flag'
  | 'share';

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    check: <path d="M10 1.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17Zm3.86 6.39-4.6 4.6-2.13-2.12a.9.9 0 1 0-1.27 1.27l2.77 2.77a.9.9 0 0 0 1.27 0l5.23-5.23a.9.9 0 1 0-1.27-1.27Z" />,
    trail: <path d="M14 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-3.5 2.5L8 11l2 2v6h2v-7l-2-2 2.5-2.5L15 10l3 1 .6-1.8-2.4-.8-2.5-3a2 2 0 0 0-1.6-.8c-.5 0-1 .2-1.4.5L6.5 8 8 9.5l2.5-2.5Z" />,
    location: <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />,
    shield: <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1 13-3-3 1.4-1.4L11 12.2l4.6-4.6L17 9l-6 6Z" />,
    play: <path d="M6 4.5v15a1 1 0 0 0 1.5.87l12-7.5a1 1 0 0 0 0-1.74l-12-7.5A1 1 0 0 0 6 4.5Z" />,
    book: <path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h13V3H6Zm0 2h11v12H6a2 2 0 0 0-1 .27V5Zm2 2v2h7V7H8Zm0 4v2h7v-2H8Z" />,
    timer: <path d="M9 1h6v2H9V1Zm3 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm1 10h-2V9h2v6Z" />,
    medal: <path d="M12 2 8 8h8l-4-6Zm0 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 3 1.2 2.4 2.6.4-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6-1.9-1.8 2.6-.4L12 11Z" />,
    trophy: <path d="M6 4h12v2h3v3a4 4 0 0 1-4 4h-.3A6 6 0 0 1 13 16.9V19h3v2H8v-2h3v-2.1A6 6 0 0 1 7.3 13H7a4 4 0 0 1-4-4V6h3V4Zm12 4V6h-1.2A6 6 0 0 1 18 8Zm-12 0a6 6 0 0 1 1.2-2H6v2Z" />,
    history: <path d="M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 2 4.9l-1.4 1.5A9 9 0 1 0 13 3Zm-1 4v5l4.3 2.6.7-1.2-3.5-2.1V7H12Z" />,
    diamond: <path d="M6 2h12l4 6-10 14L2 8l4-6Zm.5 2L4 8h5.2l1.3-4H6.5Zm5.5 0-1.3 4h2.6L12 4Zm2.3 0 1.3 4H20l-2.5-4h-2.7Z" />,
    groups: <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 2c-3 0-6 1.5-6 4.5V20h8v-2.5c0-1.2.5-2.3 1.3-3.2A9.6 9.6 0 0 0 8 13Zm8 0c-.7 0-1.4.1-2 .2 1.2 1 2 2.3 2 3.8V20h6v-2.5c0-3-3-4.5-6-4.5Z" />,
    person: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />,
    'person-add': <path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h12v-1c0-2.8 0-5 -4-5Zm9-3v-3h-2v3h-3v2h3v3h2v-3h3v-2h-3Z" />,
    gallery: <path d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v9l4-4 3 3 3-3 3 3V6H5Zm3 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />,
    instagram: <path d="M12 2.2c3.2 0 3.6 0 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.64.07 4.85s0 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58 0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.06 15.58 2.05 15.2 2.05 12s0-3.58.07-4.85C2.27 3.96 3.79 2.42 7.02 2.27 8.42 2.21 8.8 2.2 12 2.2Zm0 3.64A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />,
    heart: <path d="M12 21s-7-4.35-9.5-8.5C.5 9 2 5.5 5.5 5.5c2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 5 3.5 3 7C19 16.65 12 21 12 21Z" />,
    chevron: <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    link: <path d="M10.6 13.4a1 1 0 0 0 1.4 0l3-3a3 3 0 0 0-4.2-4.2l-1 1 1.4 1.4 1-1a1 1 0 1 1 1.4 1.4l-3 3a1 1 0 0 0 0 1.4Zm2.8-2.8a1 1 0 0 0-1.4 0l-3 3a3 3 0 0 0 4.2 4.2l1-1-1.4-1.4-1 1a1 1 0 1 1-1.4-1.4l3-3a1 1 0 0 0 0-1.4Z" />,
    external: <path d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3Zm-9 2h5v2H5v12h12v-5h2v7H3V5h2Z" />,
    edit: <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25ZM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83Z" />,
    flag: <path d="M6 3v18H4V3h2Zm2 1h12l-2.5 4L20 12H8V4Z" />,
    share: <path d="M18 16a3 3 0 0 0-2.3 1.1l-6.9-3.5a3 3 0 0 0 0-1.2l6.9-3.5a3 3 0 1 0-.7-1.9l-6.9 3.5a3 3 0 1 0 0 5l6.9 3.5A3 3 0 1 0 18 16Z" />,
  };

  const isStroke = name === 'chevron';

  return (
    <svg
      viewBox="0 0 24 24"
      fill={isStroke ? 'none' : 'currentColor'}
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
