import Image from 'next/image';
import { Reveal } from '@/components/site/Reveal';
import { Icon, type IconName } from '@/components/ui/Icon';
import { unsplashPhoto } from '@/lib/unsplash';

const noiseRows: { icon: IconName; barWidth: string; opacity: string }[] = [
  { icon: 'run', barWidth: 'w-2/3', opacity: 'opacity-90' },
  { icon: 'trail', barWidth: 'w-1/2', opacity: 'opacity-60' },
  { icon: 'timer', barWidth: 'w-3/5', opacity: 'opacity-35' },
];

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
        <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 pb-28 pt-20 md:px-16">
          <Reveal>
            <div className="max-w-3xl">
              <h2 className="mb-5 font-display text-4xl font-extrabold leading-[1.05] text-white md:text-5xl">
                The Missing Bridge in{' '}
                <span className="text-primary-container">Athletic Identity.</span>
              </h2>
              <p className="max-w-2xl text-lg leading-relaxed text-white/75">
                From fragmented posts to a unified legacy. Arc gives athletes one professional home
                to turn their performance into a story worth following and supporting.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Body */}
      <div className="relative z-10 mx-auto -mt-12 w-full max-w-[var(--spacing-container-max)] px-5 pb-24 md:px-16">
        {/* The problem — two forces Arc bridges */}
        <div className="relative">
          <div className="grid gap-6 md:grid-cols-2 md:gap-16">
            <Reveal className="h-full">
              <div className="card-lift flex h-full flex-col rounded-card border border-secondary/30 bg-white p-7">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-soft text-secondary">
                    <Icon name="insights" className="h-6 w-6" />
                  </span>
                  <h4 className="font-display text-xl font-bold text-on-surface">The Strava Clutter</h4>
                </div>
                <p className="leading-relaxed text-on-surface-variant">
                  Valuable performance data is buried in a sea of random kudos and casual activity
                  history. While excellent for tracking, it lacks the{' '}
                  <strong className="font-bold text-on-surface">
                    intentionality of a professional resume
                  </strong>
                  .
                </p>
                <div className="mt-6 rounded-input bg-surface-container p-4">
                  <p className="eyebrow mb-3 flex items-center gap-2 text-on-surface-variant">
                    <Icon name="history" className="h-4 w-4" />
                    Lost in the noise
                  </p>
                  <div className="space-y-2">
                    {noiseRows.map((row) => (
                      <div key={row.icon} className={`flex items-center gap-2.5 ${row.opacity}`}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-dim text-on-surface-variant">
                          <Icon name={row.icon} className="h-4 w-4" />
                        </span>
                        <span className={`h-2 rounded-pill bg-surface-dim ${row.barWidth}`} />
                        <span className="ml-auto h-4 w-10 shrink-0 rounded-pill bg-surface-dim" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={90} className="h-full">
              <div className="card-lift flex h-full flex-col rounded-card border border-primary/30 bg-white p-7">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon name="heart" className="h-6 w-6" />
                  </span>
                  <h4 className="font-display text-xl font-bold text-on-surface">The Instagram Trap</h4>
                </div>
                <p className="leading-relaxed text-on-surface-variant">
                  It&rsquo;s a{' '}
                  <strong className="font-bold text-on-surface">highlight reel, not a story</strong>
                  . It captures the peaks, but the full journey — and an athlete&rsquo;s past races
                  and results — gets lost in the scroll.
                </p>
                <div className="mt-6 rounded-input bg-surface-container p-4">
                  <p className="eyebrow mb-3 flex items-center gap-2 text-on-surface-variant">
                    <Icon name="gallery" className="h-4 w-4" />
                    The vanity metric
                  </p>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map((cell) => (
                      <div key={cell} className="h-9 flex-1 rounded-md bg-surface-dim" />
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Connector — bridges the two problems on wide screens */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-6 left-1/2 hidden -translate-x-1/2 flex-col items-center md:flex"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-white shadow-lg">
              <Icon name="run" className="h-6 w-6" />
            </span>
            <span className="my-2 w-px flex-1 bg-gradient-to-b from-secondary to-primary" />
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg">
              <Icon name="camera" className="h-6 w-6" />
            </span>
          </div>
        </div>

        {/* What Arc builds instead */}
        <div className="mt-20 grid gap-12 md:grid-cols-2">
          <Reveal>
            <div>
              <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-lg shadow-primary/20">
                <Icon name="book" className="h-7 w-7" />
              </span>
              <h3 className="mb-4 font-display text-2xl font-bold text-on-surface md:text-3xl">
                Unified Athletic Identity
              </h3>
              <p className="text-lg leading-relaxed text-on-surface-variant">
                No more cobbling together fragmented posts across multiple platforms. In ARC, your
                complete athletic narrative lives front and center — authentic, polished, and easy
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
              <p className="text-lg leading-relaxed text-on-surface-variant">
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
