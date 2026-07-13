import Image from 'next/image';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';

export function PhotoUploader({
  photos,
  onPick,
  onRemove,
}: {
  photos: string[];
  onPick: (files: FileList) => void;
  onRemove: (url: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-input border-2 border-dashed border-outline-variant/60 bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary hover:text-primary">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) onPick(event.target.files);
            event.target.value = '';
          }}
        />
        <Icon name="camera" className="h-5 w-5" />
        <span className="mt-1 text-[10px] font-bold">Add photos</span>
      </label>
      {photos.map((url) => (
        <div key={url} className="relative h-20 w-20 overflow-hidden rounded-input">
          <Image src={url} alt="Race photo" fill unoptimized sizes="80px" className="object-cover" />
          <button
            type="button"
            onClick={() => onRemove(url)}
            aria-label="Remove photo"
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          >
            <Icon name="close" className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function PhotoStrip({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((url, index) => (
        <div key={url} className="relative h-16 w-16 overflow-hidden rounded-input">
          <Image src={url} alt={`Race photo ${index + 1}`} fill unoptimized sizes="64px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

export function ResultsLink({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline"
    >
      <Icon name="link" className="h-3.5 w-3.5" />
      Results
    </a>
  );
}

export function Recommendation({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-input bg-secondary-container/10 p-3 text-xs text-on-surface-variant">
      <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
      <p>{text}</p>
    </div>
  );
}

export function SectionCard({
  icon,
  title,
  count,
  children,
}: {
  icon: IconName;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <Icon name={icon} className="h-6 w-6 text-primary" />
        <h2 className="font-display text-xl font-bold text-on-surface">{title}</h2>
        <span className="rounded-pill bg-surface-container px-2.5 py-0.5 text-xs font-bold text-on-surface-variant">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

export function AddButton() {
  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center gap-1.5 rounded-input bg-primary-container px-4 py-2 text-sm font-bold text-on-primary transition-colors hover:bg-primary active:scale-95"
    >
      <Icon name="plus" className="h-4 w-4" />
      Add
    </button>
  );
}

export function ReorderControls({
  onUp,
  onDown,
  isFirst,
  isLast,
}: {
  onUp: () => void;
  onDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const buttonClass =
    'rounded p-1 text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';
  return (
    <div className="flex flex-col">
      <button type="button" onClick={onUp} disabled={isFirst} aria-label="Move up" className={buttonClass}>
        <Icon name="chevron-solid" className="h-4 w-4 rotate-180" />
      </button>
      <button type="button" onClick={onDown} disabled={isLast} aria-label="Move down" className={buttonClass}>
        <Icon name="chevron-solid" className="h-4 w-4" />
      </button>
    </div>
  );
}

export function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove"
      className="shrink-0 rounded-full p-2 text-error transition-colors hover:bg-error-container/30"
    >
      <Icon name="trash" className="h-4 w-4" />
    </button>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <li className="rounded-input border border-dashed border-outline-variant/60 p-4 text-center text-sm text-on-surface-variant">
      {label}
    </li>
  );
}
