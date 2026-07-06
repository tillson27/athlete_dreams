import type { Metadata } from 'next';
import Image from 'next/image';
import { RegHeader } from '../_components/RegHeader';
import { RegFooter } from '../_components/RegFooter';
import { Icon } from '../_components/Icon';
import { PublishPanel } from './PublishPanel';

export const metadata: Metadata = {
  title: 'Registration — Final Review',
};

const personalInfo = [
  { label: 'Full Legal Name', value: 'Marcus J. Sterling' },
  { label: 'Primary Discipline', value: 'Decathlon (Track & Field)' },
  { label: 'Base Location', value: 'Austin, Texas, USA' },
  { label: 'Affiliation', value: 'Lone Star Performance Elite' },
];

const athleticStats = [
  { label: 'Current Rank', value: '#4 National' },
  { label: 'Personal Best', value: '8,720 pts' },
  { label: 'Experience', value: '8 Seasons' },
];

export default function FinalReviewPage() {
  return (
    <>
      <RegHeader backHref="/register/values-social" stepLabel="Step 4 of 4" />

      <main className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 py-12 md:px-16">
        {/* Milestone header */}
        <header className="mb-12 text-center md:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-on-secondary-container">
            <Icon name="verified" className="h-4 w-4" />
            <span className="label-bold">FINAL MILESTONE</span>
          </div>
          <h1 className="mb-4 font-display text-4xl font-extrabold text-on-surface">
            The Finish Line is Here.
          </h1>
          <p className="max-w-2xl text-lg text-on-surface-variant">
            Review your profile details before we launch your profile to the global network.
            Precision is the key to transparency.
          </p>
        </header>

        {/* Completion bar */}
        <div className="mb-12">
          <div className="mb-2 flex items-center justify-between">
            <span className="label-bold text-primary">Registration Completion</span>
            <span className="label-bold text-on-surface">100%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-pill bg-surface-container">
            <div className="progress-gradient h-full w-full rounded-pill" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: review */}
          <div className="space-y-6 lg:col-span-8">
            {/* Personal Info */}
            <ReviewCard icon="person" title="Personal Info">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {personalInfo.map((item) => (
                  <Detail key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
            </ReviewCard>

            {/* Athletic Stats */}
            <ReviewCard icon="query-stats" title="Athletic Stats">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {athleticStats.map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-surface-container-low p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {stat.label}
                    </p>
                    <p className="font-display text-2xl font-bold text-on-surface">{stat.value}</p>
                  </div>
                ))}
              </div>
            </ReviewCard>

            {/* Social & Values */}
            <ReviewCard icon="hub" title="Social & Values">
              <div className="space-y-6">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Connected Platforms
                  </p>
                  <div className="flex gap-4">
                    {['Instagram', 'Strava'].map((platform) => (
                      <div
                        key={platform}
                        className="flex items-center gap-2 rounded-full bg-surface-container px-3 py-1.5"
                      >
                        <Icon name="link" className="h-4 w-4" />
                        <span className="label-bold">{platform}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Mission Statement
                  </p>
                  <p className="border-l-4 border-primary-container pl-4 italic text-on-surface">
                    &ldquo;Pushing the boundaries of the human spirit while maintaining absolute
                    integrity. My goal is to show the world that local athletes can achieve global
                    greatness through transparent support and community resilience.&rdquo;
                  </p>
                </div>
              </div>
            </ReviewCard>
          </div>

          {/* Right: action sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="card-lift overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
                <div className="relative h-48 w-full bg-surface-container">
                  <Image
                    src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=70"
                    alt="Marcus Sterling"
                    fill
                    sizes="400px"
                    className="object-cover grayscale transition-all duration-700 hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-display text-2xl font-bold">Marcus Sterling</h3>
                    <p className="text-xs opacity-80">Track &amp; Field Elite</p>
                  </div>
                </div>
                <div className="p-6">
                  <p className="mb-6 text-on-surface">
                    This is how your profile card will appear to potential backers in the network.
                  </p>
                  <PublishPanel />
                </div>
              </div>

              {/* Security badge */}
              <div className="flex items-center gap-4 rounded-xl bg-surface-container-high p-4">
                <Icon name="lock" className="h-6 w-6 text-secondary" />
                <div>
                  <h4 className="label-bold text-on-surface">Secure Transmission</h4>
                  <p className="text-xs text-on-surface-variant">
                    Your data is encrypted using 256-bit SSL protocols.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <RegFooter />
    </>
  );
}

function ReviewCard({
  icon,
  title,
  children,
}: {
  icon: 'person' | 'query-stats' | 'hub';
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-lift rounded-xl border border-outline-variant bg-surface-container-lowest p-8">
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Icon name={icon} className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl font-bold text-on-surface">{title}</h2>
        </div>
        <button type="button" className="label-bold text-secondary hover:underline">
          EDIT
        </button>
      </div>
      {children}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {label}
      </p>
      <p className="font-medium text-on-surface">{value}</p>
    </div>
  );
}
