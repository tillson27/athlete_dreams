import Image from 'next/image';
import Link from 'next/link';
import { unsplashPhoto } from '@/lib/unsplash';

export function HomeHero() {
  return (
    <section className="relative flex h-[540px] w-full items-center overflow-hidden bg-inverse-surface md:h-[640px]">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={unsplashPhoto('1571008887538-b36bb32f4571', 1920)}
          alt="Elite athlete running a marathon"
          fill
          priority
          sizes="100vw"
          className="ken-burns object-cover object-[center_30%]"
        />
      </div>
      {/* warm directional wash for legibility */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#140b08]/90 via-[#160d09]/60 to-[#160d09]/20"
      />
      {/* vignette to focus the frame */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 105% at 50% 32%, transparent 42%, rgba(9,5,3,0.78) 100%)',
        }}
      />
      <div aria-hidden="true" className="grain pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
        <div className="max-w-3xl">
          <h1 className="font-display text-balance text-4xl font-extrabold leading-[0.98] tracking-tight text-white drop-shadow-sm md:text-6xl">
            Your <span className="text-primary-container">athletic</span> journey. Your{' '}
            <span className="text-primary-container">Arc</span>. Told in one place.
          </h1>
          <p className="mb-10 mt-6 max-w-xl text-2xl font-bold text-white/90 md:text-3xl">
            Because finish lines are only part of the story&hellip;
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-button bg-primary-container px-8 py-4 text-lg font-bold text-on-primary shadow-lg shadow-primary-container/25 transition-all hover:-translate-y-0.5 hover:bg-primary active:scale-95"
            >
              Build your story
            </Link>
            <Link
              href="/mission"
              className="inline-flex items-center justify-center gap-2 rounded-button border border-white/20 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              Our mission
            </Link>
          </div>
        </div>
      </div>

      {/* scroll cue */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-5 z-10 flex justify-center">
        <span className="scroll-cue flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white/80">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M7 10l5 5 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </section>
  );
}
