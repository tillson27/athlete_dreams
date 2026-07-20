'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchAthleteProfile } from '@/lib/api';
import { athleteProfileHref } from '@/lib/profileUrl';
import { Icon } from '@/components/ui/Icon';

// Stripe Checkout success return. The athlete slug is carried on the success_url
// (appended server-side by StripeService) so we can name the athlete without an
// authed fetch. Fulfillment is confirmed by the webhook, not this page — the copy
// is a thank-you, not a receipt.
function DonateThanksContent() {
  const params = useSearchParams();
  const slug = params.get('athlete');
  const [athleteName, setAthleteName] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    fetchAthleteProfile(slug)
      .then((profile) => {
        if (active) setAthleteName(profile.fullName);
      })
      .catch(() => {
        // Name is a nicety; the fallback copy covers an unresolved slug.
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const headline = athleteName
    ? `Congratulations on being a part of ${athleteName}’s journey`
    : 'Congratulations on being a part of this athlete’s journey';

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-5 py-16 text-center">
      <div className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-8 md:p-10">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <Icon name="heart" className="h-8 w-8" />
        </span>
        <h1 className="font-display text-2xl font-extrabold text-on-surface md:text-3xl">
          {headline}
        </h1>
        <p className="mt-3 text-on-surface-variant">
          Your donation goes directly to the athlete. You&rsquo;ll get a receipt from Stripe by
          email.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          {slug ? (
            <Link
              href={athleteProfileHref(slug)}
              className="label-bold rounded-lg bg-primary px-6 py-3 text-on-primary transition-all hover:bg-primary-strong"
            >
              Back to {athleteName ?? 'their'} profile
            </Link>
          ) : null}
          <Link
            href="/athletes"
            className="label-bold rounded-lg border-2 border-outline px-6 py-3 text-on-surface transition-all hover:bg-surface-container"
          >
            Discover more athletes
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DonateThanksPage() {
  return (
    <Suspense>
      <DonateThanksContent />
    </Suspense>
  );
}
