import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { Icon, type RegIconName } from '../_components/Icon';
import { ValueChips } from './ValueChips';

export const metadata: Metadata = {
  title: 'Registration — Values & Social',
};

type Connection = {
  name: string;
  description: string;
  icon?: RegIconName;
  iconWrap: string;
  iconColor: string;
  connectedHandle?: string;
};

const connections: Connection[] = [
  {
    name: 'Strava',
    description: 'Import training stats and verified achievements.',
    icon: 'run',
    iconWrap: 'bg-[#ffdbcf]',
    iconColor: 'text-[#FC6100]',
  },
  {
    name: 'Instagram',
    description: 'Showcase your day-to-day athlete life.',
    icon: 'camera',
    iconWrap: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]',
    iconColor: 'text-white',
    connectedHandle: '@athlete_pro',
  },
  {
    name: 'Personal Training Log',
    description: 'Sync with Google Calendar or Apple Health.',
    icon: 'calendar',
    iconWrap: 'bg-surface-container-high',
    iconColor: 'text-on-surface-variant',
  },
  {
    name: 'Garmin Connect',
    description: 'Sync workouts and technical metrics.',
    icon: 'watch',
    iconWrap: 'bg-surface-container-high',
    iconColor: 'text-on-surface-variant',
  },
  {
    name: 'Apple Watch / Health',
    description: 'Track heart rate and active calories.',
    iconWrap: 'bg-surface-container-high',
    iconColor: 'text-on-surface-variant',
  },
  {
    name: 'Coros',
    description: 'Import professional training data.',
    icon: 'chart',
    iconWrap: 'bg-surface-container-high',
    iconColor: 'text-on-surface-variant',
  },
];

export default function ValuesSocialPage() {
  return (
    <>
      <RegHeader stepLabel="STEP 3 OF 4" progressPercent={75} sticky={false} />

      <main className="flex flex-grow flex-col items-center px-5 py-12 md:px-16">
        <div className="grid w-full max-w-4xl grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Left: visual & brand */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="relative h-[480px] overflow-hidden rounded-xl shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=70"
                alt="Athlete training"
                fill
                sizes="500px"
                className="object-cover opacity-80 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-transparent to-transparent" />
              <div className="absolute inset-x-8 bottom-8">
                <div className="mb-2 flex items-center gap-2">
                  <Icon name="star" className="h-5 w-5 text-primary" />
                  <span className="label-bold uppercase tracking-widest text-white">
                    Brand Identity
                  </span>
                </div>
                <h2 className="mb-4 font-display text-3xl font-bold text-white">Craft Your Story.</h2>
                <p className="text-white/80">
                  Transparency and values are the foundation of professional funding. Tell your
                  backers what you stand for.
                </p>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="flex flex-col gap-10 lg:col-span-7">
            <section>
              <h1 className="mb-2 font-display text-4xl font-extrabold text-on-surface">
                Values &amp; Social
              </h1>
              <p className="text-lg text-on-surface-variant">
                Connect your athletic data and social presence to build credibility.
              </p>
            </section>

            <section>
              <label className="label-bold mb-4 block uppercase text-primary">
                Core Values (Select 3)
              </label>
              <ValueChips />
            </section>

            <section>
              <label className="label-bold mb-2 block uppercase text-primary" htmlFor="mission">
                Personal Mission Tagline
              </label>
              <div className="relative">
                <input
                  id="mission"
                  type="text"
                  placeholder="e.g. Breaking boundaries through daily discipline..."
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-4 outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant/50">
                  45/100
                </span>
              </div>
            </section>

            <section className="flex w-full flex-col gap-8">
              <div className="flex flex-col gap-2">
                <h2 className="font-display text-3xl font-bold text-on-surface">
                  Connect Your Journey
                </h2>
                <p className="text-on-surface-variant">
                  Integrate your active lifestyle platforms to build trust with your community.
                </p>
              </div>

              <div className="flex w-full flex-col gap-4">
                {connections.map((connection) => (
                  <div
                    key={connection.name}
                    className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-lg ${connection.iconWrap}`}
                      >
                        {connection.icon ? (
                          <Icon name={connection.icon} className={`h-8 w-8 ${connection.iconColor}`} />
                        ) : null}
                      </div>
                      <div>
                        <h3 className="label-bold text-on-surface">{connection.name}</h3>
                        <p className="text-on-surface-variant">{connection.description}</p>
                      </div>
                    </div>
                    {connection.connectedHandle ? (
                      <div className="flex items-center gap-2 rounded-full bg-surface-container px-6 py-3 font-bold text-on-surface">
                        <Icon name="check" className="h-4 w-4" />
                        <span>{connection.connectedHandle}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="rounded-full bg-secondary px-8 py-3 font-bold text-white transition-all hover:brightness-110"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Action bar */}
            <div className="mt-8 flex w-full flex-col items-center justify-between gap-4 border-t border-outline-variant pt-8 md:flex-row">
              <Link
                href="/register/athletics"
                className="flex items-center gap-2 font-bold text-secondary transition-all hover:underline"
              >
                <Icon name="arrow-back" className="h-5 w-5" />
                Back to Bio
              </Link>
              <Link
                href="/register/review"
                className="w-full rounded-lg bg-primary px-12 py-4 text-center font-bold text-white shadow-lg transition-all hover:bg-[#832700] active:scale-95 md:w-auto"
              >
                Next: Final Review
              </Link>
            </div>
          </div>
        </div>
      </main>

      <RegFooter />
    </>
  );
}
