import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { RegHeader } from './_components/RegHeader';
import { Icon, type IconName } from '@/components/ui/Icon';

export const metadata: Metadata = {
  title: 'How to Build Your Epic',
};

const steps: {
  number: string;
  icon: IconName;
  title: string;
  body: string;
}[] = [
  {
    number: '1',
    icon: 'person',
    title: '1. Personal Basics',
    body: 'Tell us who you are. This stage includes your bio, location, and the high-impact profile photography that will represent your brand to potential backers.',
  },
  {
    number: '2',
    icon: 'medal',
    title: '2. Athletics & Achievements',
    body: 'Define your performance stats. List your career highlights, current rankings, and specific athletic goals. This data forms the transparency backbone of your funding request.',
  },
  {
    number: '3',
    icon: 'sync',
    title: '3. Values & Social',
    body: 'Connect your community. Link your social handles and your fitness tracker to describe the values that drive you. This helps backers understand the person behind the athlete.',
  },
  {
    number: '4',
    icon: 'fact-check',
    title: '4. Review & Publish',
    body: 'The final sprint. Review your funding targets, breakdown of fund usage, and launch your "Epic." Our team will perform a final verification to ensure transparency.',
  },
];

const bottomNav: { icon: IconName; label: string; active?: boolean }[] = [
  { icon: 'person', label: 'Profile' },
  { icon: 'medal', label: 'Stats' },
  { icon: 'sync', label: 'Social' },
  { icon: 'fact-check', label: 'Review', active: true },
];

export default function OnboardingGuidePage() {
  return (
    <>
      <RegHeader backHref="/" showHelp />

      <main className="mx-auto w-full max-w-[var(--spacing-container-max)] px-5 pb-28 pt-12 md:px-16">
        {/* High-impact header */}
        <section className="mb-12">
          <h1 className="mb-4 font-display text-3xl font-extrabold leading-tight tracking-tight text-on-surface md:text-5xl">
            How to Build <span className="text-primary-container">Your Epic</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">
            The path to professional funding begins here. Complete these four steps to launch your
            transparent crowdfunding campaign.
          </p>
        </section>

        {/* Vertical stepper */}
        <section className="relative">
          <div
            aria-hidden="true"
            className="absolute bottom-8 left-6 top-8 hidden w-1 opacity-20 md:block"
            style={{ background: 'linear-gradient(180deg, #ff5f1f 0%, #e0e3e5 100%)' }}
          />
          <div className="grid grid-cols-1 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="group flex flex-col items-start gap-6 md:flex-row">
                <div className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-white shadow-lg transition-transform group-hover:scale-110">
                  <Icon name={step.icon} className="h-6 w-6" />
                </div>
                <div className="glass-effect flex-grow rounded-xl p-6 shadow-sm transition-shadow hover:shadow-md">
                  <h3 className="mb-2 font-display text-2xl font-bold text-on-surface">
                    {step.title}
                  </h3>
                  <p className="text-on-surface-variant">{step.body}</p>

                  {step.number === '1' ? (
                    <div className="relative mt-4 h-40 w-full overflow-hidden rounded-lg">
                      <Image
                        src="https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1000&q=70"
                        alt="Athlete profile photography"
                        fill
                        sizes="(max-width: 768px) 100vw, 700px"
                        className="object-cover grayscale transition-all duration-500 hover:grayscale-0"
                      />
                      <div className="absolute bottom-4 left-4 rounded border border-white/20 bg-white/20 px-3 py-1 text-xs text-white backdrop-blur-md">
                        Step 1: Identity
                      </div>
                    </div>
                  ) : null}

                  {step.number === '2' ? (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-surface-container p-4">
                        <span className="label-bold text-primary-container">STATS</span>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-pill bg-outline-variant">
                          <div className="h-full w-3/4 bg-gradient-to-r from-secondary to-primary-container" />
                        </div>
                      </div>
                      <div className="rounded-lg bg-surface-container p-4">
                        <span className="label-bold text-primary-container">VERIFIED</span>
                        <div className="mt-2 flex items-center gap-2">
                          <Icon name="check-circle" className="h-4 w-4 text-secondary" />
                          <span className="text-xs">Certificates</span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step.number === '3' ? (
                    <div className="mt-4 flex gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-secondary-container text-white">
                        <Icon name="share" className="h-5 w-5" />
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-tertiary-container text-white">
                        <Icon name="hub" className="h-5 w-5" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center">
          <Link
            href="/register/personal-basics"
            className="inline-flex items-center justify-center rounded-xl bg-primary-container px-12 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-xl transition-colors hover:bg-primary active:scale-95"
          >
            Get Started
          </Link>
          <p className="mt-4 text-xs text-on-surface-variant">Estimated time: 15 minutes</p>
        </section>
      </main>

      {/* Onboarding bottom nav */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around bg-surface px-4 py-2 shadow-[0_-4px_20px_0_rgba(0,0,0,0.04)]">
        {bottomNav.map((item) => (
          <span
            key={item.label}
            className={`flex flex-col items-center justify-center transition-all ${
              item.active
                ? 'rounded-xl bg-secondary-container px-4 py-1 text-on-secondary-container'
                : 'text-on-surface-variant'
            }`}
          >
            <Icon name={item.icon} className="h-6 w-6" />
            <span className="text-xs">{item.label}</span>
          </span>
        ))}
      </nav>
    </>
  );
}
