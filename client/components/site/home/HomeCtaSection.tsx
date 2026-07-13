import Link from 'next/link';
import { Reveal } from '@/components/site/Reveal';

export function HomeCtaSection() {
  return (
    <section className="bg-surface-bright px-5 py-20 md:px-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-inverse-surface p-12 text-center md:p-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_center,_var(--color-primary-container)_1px,_transparent_1px)] [background-size:40px_40px]"
          />
          <div className="relative z-10 mx-auto max-w-2xl">
            <h2 className="mb-6 font-display text-3xl font-bold text-white md:text-5xl">
              Ready to follow the next great story?
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-white/70">
              Runners are telling their whole arc on ARC — the comebacks, the 5 a.m. miles, the
              breakthroughs. Every follow puts someone in their corner.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/athletes"
                className="inline-flex items-center justify-center rounded-button bg-white px-10 py-4 text-sm font-bold text-inverse-surface transition-all hover:bg-white/90"
              >
                Discover runners
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-button bg-primary-container px-10 py-4 text-sm font-bold text-on-primary transition-all hover:bg-primary active:scale-95"
              >
                Start your story
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
