'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { drawShareCard, type ShareCardData } from '@/lib/shareImage';

export type ShareResume = {
  name: string;
  tagline: string;
  location: string;
  photo: string;
  highlights: string[];
  previousRaces: string[];
  stats: { label: string; value: string }[];
  url: string;
};

type PlatformKey =
  | 'instagram-story'
  | 'instagram-post'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'x';

type Platform = { key: PlatformKey; label: string; w: number; h: number; icon: ReactNode };

const PLATFORMS: Platform[] = [
  { key: 'instagram-story', label: 'IG Story', w: 1080, h: 1920, icon: <InstagramGlyph /> },
  { key: 'instagram-post', label: 'IG Post', w: 1080, h: 1080, icon: <InstagramGlyph /> },
  { key: 'facebook', label: 'Facebook', w: 1200, h: 630, icon: <FacebookGlyph /> },
  { key: 'linkedin', label: 'LinkedIn', w: 1200, h: 627, icon: <LinkedinGlyph /> },
  { key: 'tiktok', label: 'TikTok', w: 1080, h: 1920, icon: <TiktokGlyph /> },
  { key: 'x', label: 'X', w: 1200, h: 675, icon: <XGlyph /> },
];

export function ShareCard({
  resume,
  compact = false,
}: {
  resume: ShareResume;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<PlatformKey>('instagram-story');
  const [imageTick, setImageTick] = useState(0);
  const [highlightOn, setHighlightOn] = useState<boolean[]>(() =>
    resume.highlights.map((_, index) => index < 2),
  );
  const [raceOn, setRaceOn] = useState<boolean[]>(() => resume.previousRaces.map(() => false));
  const [statOn, setStatOn] = useState<boolean[]>(() => resume.stats.map((_, index) => index < 3));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const slug = resume.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const current = PLATFORMS.find((entry) => entry.key === platform)!;
  const webIntent = platform === 'x' || platform === 'facebook' || platform === 'linkedin';

  // Load the athlete photo once (crossOrigin so the canvas can export as PNG).
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (cancelled) return;
      imageRef.current = image;
      setImageTick((tick) => tick + 1);
    };
    image.onerror = () => {
      if (cancelled) return;
      imageRef.current = null;
      setImageTick((tick) => tick + 1);
    };
    image.src = resume.photo;
    return () => {
      cancelled = true;
    };
  }, [resume.photo]);

  // Close on Escape + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Render the card whenever the modal opens, the format changes, or the image resolves.
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    (async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      if (cancelled) return;
      canvas.width = current.w;
      canvas.height = current.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rootStyle = getComputedStyle(document.documentElement);
      const fonts = {
        display: `${rootStyle.getPropertyValue('--font-montserrat').trim() || 'sans-serif'}, sans-serif`,
        body: `${rootStyle.getPropertyValue('--font-inter').trim() || 'sans-serif'}, sans-serif`,
      };
      const shown: ShareCardData = {
        name: resume.name,
        tagline: resume.tagline,
        location: resume.location,
        url: resume.url,
        lines: [
          ...resume.highlights.filter((_, index) => highlightOn[index]),
          ...resume.previousRaces.filter((_, index) => raceOn[index]),
        ],
        stats: resume.stats.filter((_, index) => statOn[index]),
      };
      drawShareCard(ctx, current.w, current.h, shown, imageRef.current, fonts);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, platform, imageTick, current, resume, highlightOn, raceOn, statOn]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${slug}-${platform}.png`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }, 'image/png');
  };

  const share = () => {
    const url = resume.url.startsWith('http') ? resume.url : `https://${resume.url}`;
    const text = `Back ${resume.name} on ARC — ${resume.tagline}.`;
    const enc = encodeURIComponent;
    if (platform === 'x') {
      window.open(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, '_blank', 'noopener');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, '_blank', 'noopener');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, '_blank', 'noopener');
    } else {
      download();
    }
  };

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Share"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-button border border-outline text-primary transition-colors hover:bg-surface-container-low active:scale-95"
        >
          <ShareGlyph />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-button border border-outline px-8 py-4 text-sm font-bold tracking-[0.05em] text-on-surface transition-colors hover:bg-surface-container-low active:scale-95"
        >
          <ShareGlyph />
          SHARE
        </button>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Share athlete card"
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-card bg-surface-container-lowest p-6 shadow-2xl md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-on-surface">
                  Share {resume.name.split(' ')[0]}&rsquo;s card
                </h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  A ready-to-post athlete résumé, sized for each platform.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                <CloseGlyph />
              </button>
            </div>

            {/* Platform selector */}
            <div className="mb-6 flex flex-wrap gap-2">
              {PLATFORMS.map((entry) => {
                const active = entry.key === platform;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => setPlatform(entry.key)}
                    className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-bold transition-colors ${
                      active
                        ? 'bg-primary-container text-on-primary'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="h-4 w-4">{entry.icon}</span>
                    {entry.label}
                  </button>
                );
              })}
            </div>

            {/* What to include */}
            <div className="mb-6 rounded-card border border-outline-variant bg-surface-container-low p-4">
              <p className="label-bold mb-3 text-on-surface">Include on your card</p>
              <div className="space-y-3">
                <ToggleGroup
                  title="Highlights"
                  items={resume.highlights}
                  on={highlightOn}
                  onToggle={(index) =>
                    setHighlightOn((prev) => prev.map((value, i) => (i === index ? !value : value)))
                  }
                />
                <ToggleGroup
                  title="Previous races"
                  items={resume.previousRaces}
                  on={raceOn}
                  onToggle={(index) =>
                    setRaceOn((prev) => prev.map((value, i) => (i === index ? !value : value)))
                  }
                />
                <ToggleGroup
                  title="Stats"
                  items={resume.stats.map((stat) => `${stat.value} · ${stat.label}`)}
                  on={statOn}
                  onToggle={(index) =>
                    setStatOn((prev) => prev.map((value, i) => (i === index ? !value : value)))
                  }
                />
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-center rounded-card bg-surface-container p-4">
              <canvas
                ref={canvasRef}
                className="max-h-[52vh] w-auto max-w-full rounded-lg shadow-lg"
                aria-label={`${resume.name} share card preview`}
              />
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={download}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-button bg-primary-container px-6 py-3 text-sm font-bold tracking-[0.05em] text-on-primary transition-colors hover:bg-primary active:scale-95"
              >
                <DownloadGlyph />
                Download image
              </button>
              <button
                type="button"
                onClick={share}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-button border border-outline px-6 py-3 text-sm font-bold tracking-[0.05em] text-on-surface transition-colors hover:bg-surface-container-low active:scale-95"
              >
                <span className="h-4 w-4">{current.icon}</span>
                {webIntent ? `Share to ${current.label}` : `Open ${current.label}`}
              </button>
            </div>
            <p className="mt-3 text-center text-xs text-on-surface-variant">
              {webIntent
                ? 'The composer opens with your link — download the image and attach it to the post.'
                : `${current.label} doesn't allow direct web posting. Download the image, then add it to your ${current.label} post.`}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ---------- include toggles ---------- */

function ToggleGroup({
  title,
  items,
  on,
  onToggle,
}: {
  title: string;
  items: string[];
  on: boolean[];
  onToggle: (index: number) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((label, index) => {
          const active = on[index];
          return (
            <button
              key={label}
              type="button"
              onClick={() => onToggle(index)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-primary-container text-on-primary'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
            >
              <span className="h-3.5 w-3.5">{active ? <CheckGlyph /> : <PlusGlyph />}</span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  );
}

function PlusGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" />
    </svg>
  );
}

/* ---------- glyphs ---------- */

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M18 16a3 3 0 0 0-2.3 1.1l-6.9-3.5a3 3 0 0 0 0-1.2l6.9-3.5a3 3 0 1 0-.7-1.9l-6.9 3.5a3 3 0 1 0 0 5l6.9 3.5A3 3 0 1 0 18 16Z" />
    </svg>
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
      <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.71 2.89 18.3 9.17 12 2.89 5.71 4.3 4.29l6.29 6.3 6.3-6.3z" />
    </svg>
  );
}

function DownloadGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M11 3h2v8h3l-4 5-4-5h3V3ZM5 19h14v2H5v-2Z" />
    </svg>
  );
}

function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M12 2.2c3.2 0 3.6 0 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.64.07 4.85s0 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58 0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.06 15.58 2.05 15.2 2.05 12s0-3.58.07-4.85C2.27 3.96 3.79 2.42 7.02 2.27 8.42 2.21 8.8 2.2 12 2.2Zm0 3.64A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8Zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
    </svg>
  );
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.75-1.6 1.5V12h2.7l-.43 2.9h-2.27v7A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function LinkedinGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21h-4V9Z" />
    </svg>
  );
}

function TiktokGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M16 3c.3 2.2 1.6 3.9 3.8 4.2v2.6c-1.4.1-2.7-.3-3.8-1v6.1a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v2.7a3.2 3.2 0 1 0 2.3 3V3H16Z" />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M18.24 2.25h3.3l-7.2 8.24 8.47 11.26h-6.63l-5.2-6.8-5.95 6.8H1.72l7.7-8.8L1.3 2.25h6.8l4.7 6.22 5.44-6.22Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
    </svg>
  );
}
