import Link from 'next/link';
import { Reveal } from '@/components/site/Reveal';
import { Icon } from '@/components/ui/Icon';
import { arcSteps } from '@/lib/homeContent';

export function TellYourArcSection() {
  return (
    <section className="relative overflow-hidden border-b border-outline-variant bg-gradient-to-b from-surface-container-low to-white py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-5 [background-image:radial-gradient(circle_at_center,_var(--color-primary)_1px,_transparent_1px)] [background-size:32px_32px]"
      />
      <div className="relative z-10 mx-auto w-full max-w-[var(--spacing-container-max)] px-5 md:px-16">
        <Reveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-6 font-display text-3xl font-bold text-on-surface md:text-5xl">
              Tell Your Arc
            </h2>
            <p className="text-lg leading-relaxed text-on-surface-variant">
              Your athletic career deserves a professional home. Launch your athlete profile in
              three simple steps designed for elite performance.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto mb-12 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {arcSteps.map((step, index) => (
            <Reveal key={step.number} delay={index * 90} className="h-full">
              <div className="group relative flex h-full flex-col items-center rounded-card border border-outline-variant/30 bg-white/60 p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_26px_50px_-24px_rgba(171,54,0,0.4)]">
                <span className="absolute left-5 top-4 font-display text-2xl font-extrabold text-primary/20">
                  {step.number}
                </span>
                {step.comingSoon && (
                  <span className="absolute right-4 top-4 rounded-pill bg-secondary-soft px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-secondary">
                    Coming soon
                  </span>
                )}
                <div className="mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
                    <Icon name={step.icon} className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="mb-3 font-display text-xl font-bold text-on-surface">{step.title}</h4>
                <p className="text-on-surface-variant">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="flex justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-card bg-primary-container px-12 py-5 text-lg font-bold tracking-[0.05em] text-on-primary shadow-xl transition-all hover:-translate-y-1 hover:shadow-primary/25 active:scale-95"
          >
            Start your journey
          </Link>
        </div>
      </div>
    </section>
  );
}
