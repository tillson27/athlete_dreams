'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { Icon } from './Icon';

type CarouselPhoto = {
  id: string;
  src: string;
  alt: string;
};

type PhotoCarouselProps = {
  photos: CarouselPhoto[];
  openIndex: number;
  onClose: () => void;
};

const SWIPE_THRESHOLD_PX = 48;

export function PhotoCarousel({ photos, openIndex, onClose }: PhotoCarouselProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [index, setIndex] = useState(Math.max(openIndex, 0));
  const activePhoto = photos[index] ?? photos[0];

  const goPrevious = useCallback(() => {
    setIndex((current) => (current - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goNext = useCallback(() => {
    setIndex((current) => (current + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (openIndex >= 0) {
      setIndex(Math.min(openIndex, photos.length - 1));
      if (!dialog.open) dialog.showModal();
      return;
    }

    if (dialog.open) dialog.close();
  }, [openIndex, photos.length]);

  useEffect(() => {
    if (openIndex < 0) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex]);

  useEffect(() => {
    if (openIndex < 0 || photos.length <= 1) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') goPrevious();
      if (event.key === 'ArrowRight') goNext();
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [goNext, goPrevious, openIndex, photos.length]);

  if (!activePhoto) return null;

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || photos.length <= 1) return;

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX > 0) {
      goPrevious();
    } else {
      goNext();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="m-0 h-dvh max-h-none w-dvw max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80"
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div
        className="relative flex h-full w-full touch-pan-y items-center justify-center px-4 py-16 md:px-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          aria-label="Close gallery"
          title="Close gallery"
          className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          onClick={onClose}
        >
          <Icon name="close" className="h-5 w-5" />
        </button>

        {photos.length > 1 ? (
          <button
            type="button"
            aria-label="Previous photo"
            title="Previous photo"
            className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:flex"
            onClick={goPrevious}
          >
            <Icon name="arrow-back" className="h-5 w-5" />
          </button>
        ) : null}

        <div className="relative h-full max-h-[82dvh] w-full max-w-5xl">
          <Image
            src={activePhoto.src}
            alt={activePhoto.alt}
            fill
            unoptimized
            sizes="100vw"
            className="object-contain"
          />
        </div>

        {photos.length > 1 ? (
          <button
            type="button"
            aria-label="Next photo"
            title="Next photo"
            className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:flex"
            onClick={goNext}
          >
            <Icon name="arrow-forward" className="h-5 w-5" />
          </button>
        ) : null}

        <div className="absolute inset-x-0 bottom-5 flex justify-center">
          <span className="rounded-pill bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
            {index + 1} / {photos.length}
          </span>
        </div>
      </div>
    </dialog>
  );
}
