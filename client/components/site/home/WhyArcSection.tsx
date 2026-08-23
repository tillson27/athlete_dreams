import Image from 'next/image';
import { Reveal } from '@/components/site/Reveal';
import { Icon } from '@/components/ui/Icon';
import { unsplashPhoto } from '@/lib/unsplash';

export function WhyArcSection() {
  return (
    <section className="relative overflow-hidden bg-surface">
      {/* Photographic header band */}
      <div className="relative overflow-hidden bg-inverse-surface">
        <div className="absolute inset-0">
          <Image
            src={unsplashPhoto('1508973379184-7517410fb0bc', 1920)}
            alt="Sprinter driving out of the starting blocks"
            fill
            sizes="100vw"
            className="object-cover object-[center_30%]"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#140b08]/85 via-[#160d09]/80 to-surface"
        />
        <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 pb-14 pt-14 md:px-16 md:pb-20 md:pt-20">
          <Reveal>
            <div className="max-w-3xl">
              <h2 className="mb-4 font-display text-[30px] font-extrabold leading-[1.05] text-white sm:text-4xl md:mb-5 md:text-5xl">
                The Missing Bridge in{' '}
                <span className="text-primary-container">Athletic Identity.</span>
              </h2>
              <p className="max-w-2xl leading-relaxed text-white/75 md:text-lg">
                From fragmented posts to a unified legacy. Arc gives athletes one professional home
                to turn their performance into a story worth following and supporting.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 pb-14 pt-14 md:px-16 md:pb-24 md:pt-20">
        {/* What Arc builds instead */}
        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          <Reveal>
            <div>
              <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg shadow-primary/20">
                <Icon name="book" className="h-7 w-7" />
              </span>
              <h3 className="mb-4 font-display text-2xl font-bold text-on-surface md:text-3xl">
                Unified Athletic Identity
              </h3>
              <p className="leading-relaxed text-on-surface-variant md:text-lg">
                No more cobbling together fragmented posts across multiple platforms. In ARC, your
                complete athletic narrative lives front and center: authentic, polished, and easy
                for others to follow.
              </p>
              <div className="mt-6 border-l-4 border-primary pl-4">
                <p className="eyebrow text-on-surface">Author your legacy</p>
                <p className="mt-1 leading-relaxed text-on-surface-variant">
                  The premier storytelling platform for athletes who want their full journey seen,
                  supported, and celebrated.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div>
              <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/20">
                <Icon name="groups" className="h-7 w-7" />
              </span>
              <h3 className="mb-4 font-display text-2xl font-bold text-on-surface md:text-3xl">
                From Spectators to Supporters
              </h3>
              <p className="leading-relaxed text-on-surface-variant md:text-lg">
                Athletes who share their authentic stories create a powerful opportunity for
                supporters to follow their journey, feel like an integral part of it, and
                contribute meaningfully when backing opens.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
