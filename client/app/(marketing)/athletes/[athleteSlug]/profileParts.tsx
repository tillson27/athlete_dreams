import Image from 'next/image';
import { Icon, type IconName } from '@/components/ui/Icon';
import { unsplashPhoto as img } from '@/lib/unsplash';

// Shared presentational pieces for the athlete profile. Pure (no hooks / client
// APIs) so both the server profile and the client editable sections can use them.

export { Icon, img };
export type { IconName };

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
              className="relative aspect-[3/4] overflow-hidden rounded-input bg-surface-container"
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
  links?: { label: string; href: string }[];
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
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
              >
                <Icon name="link" className="h-4 w-4" />
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
        {images.length > 0 ? (
          <div className={images.length > 1 ? 'grid grid-cols-2 gap-2' : 'overflow-hidden rounded-input'}>
            {images.map((image, index) => (
              <div
                key={`${name}-${index}`}
                className={`relative overflow-hidden rounded-input bg-surface-container ${
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
