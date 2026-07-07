'use client';

import Link from 'next/link';
import { Icon, type RegIconName } from '../_components/Icon';
import { ProfilePreview } from '../_components/ProfilePreview';
import { useOnboarding } from '../_components/OnboardingContext';
import { StartOverButton } from '../_components/StartOverButton';
import { PublishPanel } from './PublishPanel';

export function ReviewSummary() {
  const { profile } = useOnboarding();
  const firstName = profile.name.trim().split(' ')[0] || 'there';
  const filledBests = profile.personalBests.filter((best) => best.distance && best.time);

  return (
    <>
      {/* Milestone header */}
      <header className="mb-12">
        <div className="flex flex-col gap-4 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-on-secondary-container">
              <Icon name="verified" className="h-4 w-4" />
              <span className="label-bold">FINAL STEP</span>
            </div>
            <h1 className="mb-4 font-display text-4xl font-extrabold text-on-surface">
              You&rsquo;re one tap away, {firstName}.
            </h1>
            <p className="max-w-2xl text-lg text-on-surface-variant">
              Here&rsquo;s the profile you just built. Give it a last look, then make it live.
            </p>
          </div>
          <StartOverButton className="label-bold inline-flex shrink-0 items-center justify-center gap-1.5 self-center rounded-lg border border-outline-variant px-4 py-2.5 text-on-surface-variant transition-colors hover:border-error hover:text-error md:self-start" />
        </div>
      </header>

      {/* Completion bar */}
      <div className="mb-12">
        <div className="mb-2 flex items-center justify-between">
          <span className="label-bold text-primary">Profile complete</span>
          <span className="label-bold text-on-surface">100%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-pill bg-surface-container">
          <div className="progress-gradient h-full w-full rounded-pill" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: review */}
        <div className="space-y-6 lg:col-span-8">
          <ReviewCard icon="person" title="Basics" editHref="/register/personal-basics?from=review">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Detail label="Name" value={profile.name} />
              <Detail label="Discipline" value={profile.discipline} />
              <Detail label="Location" value={profile.location} />
            </div>
          </ReviewCard>

          <ReviewCard icon="star" title="Your story" editHref="/register/personal-basics?from=review">
            {profile.bio ? (
              <p className="leading-relaxed text-on-surface">{profile.bio}</p>
            ) : (
              <Empty>Add a few lines about your running in Step 1.</Empty>
            )}
          </ReviewCard>

          <ReviewCard icon="trophy" title="Personal bests" editHref="/register/athletics?from=review">
            {filledBests.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {filledBests.map((best) => (
                  <div key={best.id} className="rounded-lg bg-surface-container-low p-4">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {best.distance}
                    </p>
                    <p className="font-display text-xl font-bold text-on-surface">{best.time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>Add your personal bests in Step 2.</Empty>
            )}
          </ReviewCard>

          <ReviewCard icon="hub" title="Values & voice" editHref="/register/values-social?from=review">
            <div className="space-y-6">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Values
                </p>
                {profile.values.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.values.map((value) => (
                      <span
                        key={value}
                        className="rounded-full bg-secondary-soft px-3 py-1.5 label-bold text-secondary"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                ) : (
                  <Empty>Pick a few values in Step 3.</Empty>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Tagline
                </p>
                {profile.mission ? (
                  <p className="border-l-4 border-primary-container pl-4 italic text-on-surface">
                    &ldquo;{profile.mission}&rdquo;
                  </p>
                ) : (
                  <Empty>Add a tagline in Step 3.</Empty>
                )}
              </div>
            </div>
          </ReviewCard>
        </div>

        {/* Right: the built profile + publish */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-6">
            <ProfilePreview sticky={false} />
            <div className="card-lift rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
              <PublishPanel />
            </div>
            <div className="flex items-center gap-4 rounded-xl bg-surface-container-high p-4">
              <Icon name="lock" className="h-6 w-6 shrink-0 text-secondary" />
              <div>
                <h4 className="label-bold text-on-surface">Secure &amp; verified</h4>
                <p className="text-xs text-on-surface-variant">
                  Your profile is verified before it goes live to the network.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ReviewCard({
  icon,
  title,
  editHref,
  children,
}: {
  icon: RegIconName;
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card-lift rounded-xl border border-outline-variant bg-surface-container-lowest p-8">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Icon name={icon} className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl font-bold text-on-surface">{title}</h2>
        </div>
        <Link href={editHref} className="label-bold text-secondary hover:underline">
          EDIT
        </Link>
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
      <p className={`font-medium ${value ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
        {value || 'Not added yet'}
      </p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm italic text-on-surface-variant/60">{children}</p>;
}
