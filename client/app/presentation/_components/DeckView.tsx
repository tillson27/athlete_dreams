'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Button, LinkButton } from '@/components/ui/Button';
import type { Slide, SlideSectionKey } from './_shell';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ListTree,
  Lock,
  Maximize2,
  Minimize2,
  X,
} from './icons';

const DECK_PASSWORD: string = 'fadnetwork';
const SESSION_KEY: string = 'fad:presentation:auth:v1';

const CANVAS_WIDTH: number = 1280;
const CANVAS_HEIGHT: number = 720;

const sessionAuthListeners: Set<() => void> = new Set();

function subscribeToSessionAuth(listener: () => void): () => void {
  sessionAuthListeners.add(listener);
  return () => {
    sessionAuthListeners.delete(listener);
  };
}

function getSessionAuthClientSnapshot(): boolean {
  return window.sessionStorage.getItem(SESSION_KEY) === '1';
}

function getSessionAuthServerSnapshot(): boolean {
  return false;
}

function persistSessionAuth(): void {
  window.sessionStorage.setItem(SESSION_KEY, '1');
  sessionAuthListeners.forEach((listener) => listener());
}

export type DeckViewProps = {
  mainSlides: ReadonlyArray<Slide>;
  appendixSlides: ReadonlyArray<Slide>;
  sections: ReadonlyArray<{ key: SlideSectionKey; label: string }>;
};

export function DeckView({ mainSlides, appendixSlides, sections }: DeckViewProps) {
  const isAuthenticated: boolean = useSyncExternalStore(
    subscribeToSessionAuth,
    getSessionAuthClientSnapshot,
    getSessionAuthServerSnapshot,
  );

  const handleAuthenticated = useCallback((): void => {
    persistSessionAuth();
  }, []);

  const allSlides: ReadonlyArray<Slide> = useMemo(
    () => [...mainSlides, ...appendixSlides],
    [mainSlides, appendixSlides],
  );

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={handleAuthenticated} />;
  }

  return (
    <>
      <PrintStyles />
      <PitchDeck slides={allSlides} mainCount={mainSlides.length} sections={sections} />
      <PrintableDeck slides={allSlides} />
    </>
  );
}

function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (passwordInput.trim().toLowerCase() === DECK_PASSWORD) {
      onAuthenticated();
      return;
    }
    setHasError(true);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-inverse-surface px-6 py-16">
      <div className="w-full max-w-md rounded-card border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur sm:p-10">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-card bg-primary-container/15 text-primary-container">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">FAD Network</p>
            <h1 className="text-lg font-bold text-white">Investor Brief</h1>
          </div>
        </div>

        <p className="mb-6 text-sm text-white/70">
          This deck is confidential. Enter the access code shared with you to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="presentation-password"
              className="mb-1.5 block text-sm font-semibold text-white"
            >
              Access code
            </label>
            <input
              id="presentation-password"
              type="password"
              autoFocus
              autoComplete="off"
              value={passwordInput}
              onChange={(event) => {
                setPasswordInput(event.target.value);
                if (hasError) {
                  setHasError(false);
                }
              }}
              placeholder="Enter code"
              className={`w-full rounded-input border bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-primary-container ${
                hasError ? 'border-red-400' : 'border-white/15'
              }`}
            />
            {hasError ? (
              <p className="mt-2 text-xs text-red-300">Incorrect access code. Try again.</p>
            ) : null}
          </div>

          <Button type="submit" tone="primary" size="lg" className="w-full">
            View deck
          </Button>
        </form>

        <p className="mt-6 text-xs text-white/55">
          Need access? Email{' '}
          <a href="mailto:hello@fad.network" className="font-semibold text-primary-container hover:underline">
            hello@fad.network
          </a>
          .
        </p>

        <div className="mt-8 border-t border-white/10 pt-6 text-xs text-white/50">
          <LinkButton href="/mission" tone="ghost" size="sm" className="!text-white/70 hover:!bg-white/10">
            ← Back to FAD Mission
          </LinkButton>
        </div>
      </div>
    </div>
  );
}

type SlideEntry = {
  index: number;
  id: string;
  title: string;
  section: SlideSectionKey;
};

function PitchDeck({
  slides,
  mainCount,
  sections,
}: {
  slides: ReadonlyArray<Slide>;
  mainCount: number;
  sections: ReadonlyArray<{ key: SlideSectionKey; label: string }>;
}) {
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const totalSlides: number = slides.length;

  const goToSlide = useCallback(
    (nextIndex: number): void => {
      const clampedIndex: number = Math.max(0, Math.min(totalSlides - 1, nextIndex));
      setActiveSlideIndex((current) => {
        if (clampedIndex === current) {
          return current;
        }
        setDirection(clampedIndex > current ? 1 : -1);
        return clampedIndex;
      });
    },
    [totalSlides],
  );

  const goNext = useCallback((): void => {
    goToSlide(activeSlideIndex + 1);
  }, [activeSlideIndex, goToSlide]);

  const goPrev = useCallback((): void => {
    goToSlide(activeSlideIndex - 1);
  }, [activeSlideIndex, goToSlide]);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLElement>): void => {
    const firstTouch: React.Touch = event.touches[0];
    touchStartXRef.current = firstTouch.clientX;
    touchStartYRef.current = firstTouch.clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLElement>): void => {
      const startX: number | null = touchStartXRef.current;
      const startY: number | null = touchStartYRef.current;
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      if (startX === null || startY === null) {
        return;
      }
      const endTouch: React.Touch = event.changedTouches[0];
      const deltaX: number = endTouch.clientX - startX;
      const deltaY: number = endTouch.clientY - startY;
      const swipeThresholdPx: number = 48;
      if (Math.abs(deltaX) < swipeThresholdPx) {
        return;
      }
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }
      if (deltaX < 0) {
        goNext();
        return;
      }
      goPrev();
    },
    [goNext, goPrev],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isTocOpen) {
        event.preventDefault();
        setIsTocOpen(false);
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        goPrev();
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        goToSlide(0);
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        goToSlide(totalSlides - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, goToSlide, isTocOpen, totalSlides]);

  useEffect(() => {
    const handleFullscreenChange = (): void => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = useCallback((): void => {
    const node: HTMLDivElement | null = containerRef.current;
    if (!node) {
      return;
    }
    if (!document.fullscreenElement) {
      void node.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  }, []);

  const handleDownloadPdf = useCallback((): void => {
    window.print();
  }, []);

  const slideEntriesBySection: ReadonlyArray<{
    key: SlideSectionKey;
    label: string;
    entries: ReadonlyArray<SlideEntry>;
  }> = useMemo(() => {
    return sections.map((section) => ({
      key: section.key,
      label: section.label,
      entries: slides
        .map(
          (slide, slideIndex): SlideEntry => ({
            index: slideIndex,
            id: slide.id,
            title: slide.title,
            section: slide.section,
          }),
        )
        .filter((entry) => entry.section === section.key),
    }));
  }, [sections, slides]);

  const activeSlide: Slide = slides[activeSlideIndex];
  const inAppendix: boolean = activeSlideIndex >= mainCount;
  const displayIndex: number = inAppendix ? activeSlideIndex - mainCount + 1 : activeSlideIndex + 1;
  const displayTotal: number = inAppendix ? slides.length - mainCount : mainCount;
  const progressPercent: number = ((activeSlideIndex + 1) / totalSlides) * 100;

  const handleSelectSlide = useCallback(
    (slideIndex: number): void => {
      goToSlide(slideIndex);
      setIsTocOpen(false);
    },
    [goToSlide],
  );

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="presentation-screen relative h-dvh w-full overflow-hidden text-white lg:flex lg:flex-col"
      style={{ background: 'radial-gradient(ellipse at top, #2d3133, #181c1e)' }}
    >
      <div className="absolute left-0 right-0 top-0 z-30 h-0.5 bg-white/10 lg:h-1">
        <div
          className="h-full bg-gradient-to-r from-secondary to-primary-container transition-[width] duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/55 via-black/25 to-transparent lg:hidden"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-black/55 via-black/25 to-transparent lg:hidden"
      />

      <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-2 px-3 pt-3 sm:px-5 sm:pt-4 lg:relative lg:gap-3 lg:px-10 lg:pt-6">
        <div className="flex min-w-0 items-center gap-2 rounded-pill bg-black/35 px-2 py-1.5 text-white/85 shadow-[0_4px_18px_-6px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-xl lg:rounded-none lg:bg-transparent lg:px-0 lg:py-0 lg:text-white/80 lg:shadow-none lg:ring-0 lg:backdrop-blur-none">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary-container text-[11px] font-extrabold tracking-tight text-on-primary lg:h-8 lg:w-8 lg:rounded-lg lg:text-sm">
            F
          </span>
          <div className="hidden min-w-0 flex-col leading-tight sm:flex lg:flex">
            <span className="truncate text-[12px] font-bold text-white lg:text-sm">FAD Network</span>
            <span className="hidden truncate text-[10px] uppercase tracking-[0.18em] text-white/55 sm:inline lg:text-[11px] lg:text-white/50">
              Investor Brief · Confidential
            </span>
          </div>
          <span className="ml-1.5 mr-1 rounded-pill bg-white/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-white/85 lg:hidden">
            {inAppendix ? 'A' : ''}
            {String(displayIndex).padStart(2, '0')}
            <span className="text-white/40"> / </span>
            {String(displayTotal).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-white/70 lg:gap-2">
          <span className="hidden text-xs font-semibold tabular-nums text-white/70 lg:inline">
            {inAppendix ? 'Appendix ' : ''}
            {String(displayIndex).padStart(2, '0')} / {String(displayTotal).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={handleDownloadPdf}
            aria-label="Download as PDF"
            className="inline-flex h-9 w-9 items-center justify-center rounded-pill bg-black/35 text-white/85 shadow-[0_4px_18px_-6px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-xl transition hover:bg-black/50 lg:h-auto lg:w-auto lg:gap-1.5 lg:rounded-lg lg:bg-white/5 lg:px-3 lg:py-2 lg:text-xs lg:font-semibold lg:shadow-none lg:ring-0 lg:backdrop-blur-none lg:hover:bg-white/10"
          >
            <Download className="h-4 w-4" />
            <span className="hidden lg:inline">PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setIsTocOpen(true)}
            aria-label="Open sections"
            className="inline-flex h-9 w-9 items-center justify-center rounded-pill bg-black/35 text-white/85 shadow-[0_4px_18px_-6px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-xl transition hover:bg-black/50 lg:h-auto lg:w-auto lg:gap-1.5 lg:rounded-lg lg:bg-white/5 lg:px-3 lg:py-2 lg:text-xs lg:font-semibold lg:shadow-none lg:ring-0 lg:backdrop-blur-none lg:hover:bg-white/10"
          >
            <ListTree className="h-4 w-4" />
            <span className="hidden lg:inline">Sections</span>
          </button>
          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="hidden rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10 lg:inline-flex"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="relative z-0 flex h-full w-full items-center justify-center overflow-hidden px-3 py-3 sm:px-5 lg:z-10 lg:h-auto lg:flex-1 lg:gap-6 lg:px-8 lg:py-9">
        <button
          type="button"
          onClick={goPrev}
          disabled={activeSlideIndex === 0}
          aria-label="Previous slide"
          className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-pill text-white/40 transition hover:bg-white/10 hover:text-white/90 disabled:pointer-events-none disabled:opacity-15 lg:inline-flex"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="relative w-full max-w-[min(100%,calc((100dvh-1.5rem)*16/9))] lg:max-w-[1280px]">
          <SlideCanvas activeSlide={activeSlide} direction={direction} />
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={activeSlideIndex === totalSlides - 1}
          aria-label="Next slide"
          className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-pill text-white/40 transition hover:bg-white/10 hover:text-white/90 disabled:pointer-events-none disabled:opacity-15 lg:inline-flex"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-2 px-3 pb-3 sm:px-5 sm:pb-4 lg:relative lg:justify-between lg:gap-3 lg:px-10 lg:pb-6">
        <div className="flex items-center gap-1.5 rounded-pill bg-black/40 p-1 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7)] ring-1 ring-white/10 backdrop-blur-xl lg:contents lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0 lg:backdrop-blur-none">
          <button
            type="button"
            onClick={goPrev}
            disabled={activeSlideIndex === 0}
            aria-label="Previous slide"
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-pill text-white/90 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30 lg:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={goPrev}
            disabled={activeSlideIndex === 0}
            aria-label="Previous slide"
            className="hidden h-9 items-center gap-1 rounded-pill px-3 text-xs font-semibold text-white/85 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30 lg:inline-flex"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Prev</span>
          </button>

          <SlideIndicator
            mainCount={mainCount}
            totalSlides={totalSlides}
            activeSlideIndex={activeSlideIndex}
            onSelectSlide={goToSlide}
          />

          <button
            type="button"
            onClick={goNext}
            disabled={activeSlideIndex === totalSlides - 1}
            aria-label="Next slide"
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-pill text-white/90 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30 lg:hidden"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={activeSlideIndex === totalSlides - 1}
            aria-label="Next slide"
            className="hidden h-9 items-center gap-1 rounded-pill px-3 text-xs font-semibold text-white/85 transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30 lg:inline-flex"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </footer>

      <TableOfContents
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        sections={slideEntriesBySection}
        mainCount={mainCount}
        activeSlideIndex={activeSlideIndex}
        onSelectSlide={handleSelectSlide}
      />
    </div>
  );
}

function SlideCanvas({
  activeSlide,
  direction,
}: {
  activeSlide: Slide;
  direction: 1 | -1;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderedSlideId, setRenderedSlideId] = useState<string>(activeSlide.id);
  const [transitionDirection, setTransitionDirection] = useState<1 | -1>(direction);

  useLayoutEffect(() => {
    const node: HTMLDivElement | null = containerRef.current;
    if (!node) {
      return;
    }
    const updateScale = (): void => {
      const scale: number = node.clientWidth / CANVAS_WIDTH;
      node.style.setProperty('--slide-scale', String(scale));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (activeSlide.id !== renderedSlideId) {
      setTransitionDirection(direction);
      setRenderedSlideId(activeSlide.id);
    }
  }, [activeSlide.id, direction, renderedSlideId]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-[20px] bg-surface-container-lowest ring-1 ring-white/10 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7)] sm:rounded-[24px] lg:rounded-[28px] lg:border lg:border-white/10 lg:shadow-[0_30px_120px_-30px_rgba(0,0,0,0.6)]"
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          transform: 'scale(var(--slide-scale, 1))',
        }}
      >
        <div
          key={activeSlide.id}
          className="absolute inset-0 overflow-hidden"
          style={{
            animation: `slide-${transitionDirection === 1 ? 'in-right' : 'in-left'} 320ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          {activeSlide.render()}
        </div>
      </div>
      <style>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function PrintableDeck({ slides }: { slides: ReadonlyArray<Slide> }) {
  return (
    <div className="presentation-print" aria-hidden="true">
      {slides.map((slide) => (
        <section key={slide.id} className="printable-slide">
          {slide.render()}
        </section>
      ))}
    </div>
  );
}

function PrintStyles() {
  return (
    <style>{`
      @page {
        size: ${CANVAS_WIDTH}px ${CANVAS_HEIGHT}px;
        margin: 0;
      }

      .presentation-print {
        display: none;
      }

      @media print {
        html, body {
          background: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .presentation-screen {
          display: none !important;
        }
        .presentation-print {
          display: block !important;
        }
      }

      .printable-slide {
        position: relative;
        width: ${CANVAS_WIDTH}px;
        height: ${CANVAS_HEIGHT}px;
        overflow: hidden;
        background: #ffffff;
        page-break-after: always;
        page-break-inside: avoid;
        break-after: page;
        break-inside: avoid;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .printable-slide:last-child {
        page-break-after: auto;
        break-after: auto;
      }
    `}</style>
  );
}

function SlideIndicator({
  mainCount,
  totalSlides,
  activeSlideIndex,
  onSelectSlide,
}: {
  mainCount: number;
  totalSlides: number;
  activeSlideIndex: number;
  onSelectSlide: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {Array.from({ length: totalSlides }).map((_, slideIndex) => {
        const isActive: boolean = slideIndex === activeSlideIndex;
        const isAppendix: boolean = slideIndex >= mainCount;
        const isFirstAppendix: boolean = slideIndex === mainCount;
        return (
          <div key={slideIndex} className="flex items-center gap-1.5">
            {isFirstAppendix ? (
              <span aria-hidden="true" className="mx-1 h-3 w-px bg-white/20" />
            ) : null}
            <button
              type="button"
              onClick={() => onSelectSlide(slideIndex)}
              aria-label={`Go to slide ${slideIndex + 1}`}
              aria-current={isActive ? 'true' : undefined}
              className={
                isActive
                  ? 'h-1.5 w-6 rounded-pill bg-white transition-all'
                  : isAppendix
                    ? 'h-1.5 w-1.5 rounded-pill bg-white/15 transition-all hover:bg-white/40'
                    : 'h-1.5 w-1.5 rounded-pill bg-white/30 transition-all hover:bg-white/60'
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function TableOfContents({
  isOpen,
  onClose,
  sections,
  mainCount,
  activeSlideIndex,
  onSelectSlide,
}: {
  isOpen: boolean;
  onClose: () => void;
  sections: ReadonlyArray<{
    key: SlideSectionKey;
    label: string;
    entries: ReadonlyArray<SlideEntry>;
  }>;
  mainCount: number;
  activeSlideIndex: number;
  onSelectSlide: (slideIndex: number) => void;
}) {
  if (!isOpen) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close sections"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-label="Sections"
        className="absolute right-0 top-0 flex h-dvh w-full max-w-sm flex-col overflow-y-auto border-l border-white/10 bg-inverse-surface text-white shadow-2xl"
        style={{ animation: 'toc-in 320ms cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <style>{`
          @keyframes toc-in {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-inverse-surface px-5 py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Sections</p>
            <p className="text-base font-bold text-white">Jump to a slide</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <nav className="flex flex-col gap-6 px-5 py-6">
          {sections.map((section) => {
            if (section.entries.length === 0) {
              return null;
            }
            return (
              <div key={section.key}>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">
                  {section.label}
                </p>
                <ul className="space-y-1">
                  {section.entries.map((entry) => {
                    const isActive: boolean = entry.index === activeSlideIndex;
                    const isAppendix: boolean = entry.index >= mainCount;
                    const numberLabel: string = isAppendix
                      ? `A${String(entry.index - mainCount + 1).padStart(2, '0')}`
                      : String(entry.index + 1).padStart(2, '0');
                    return (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => onSelectSlide(entry.index)}
                          aria-current={isActive ? 'true' : undefined}
                          className={
                            isActive
                              ? 'flex w-full items-center gap-3 rounded-card border border-primary-container/50 bg-primary-container/15 px-3 py-2.5 text-left text-sm text-white transition'
                              : 'flex w-full items-center gap-3 rounded-card border border-transparent bg-white/[0.02] px-3 py-2.5 text-left text-sm text-white/80 transition hover:border-white/10 hover:bg-white/5 hover:text-white'
                          }
                        >
                          <span
                            className={
                              isActive
                                ? 'flex h-6 w-9 flex-shrink-0 items-center justify-center rounded-md bg-primary-container text-[11px] font-bold text-on-primary'
                                : 'flex h-6 w-9 flex-shrink-0 items-center justify-center rounded-md bg-white/10 text-[11px] font-bold text-white/70'
                            }
                          >
                            {numberLabel}
                          </span>
                          <span className="truncate">{entry.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
