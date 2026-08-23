'use client';

import { useEffect, useState } from 'react';
import type { AthletePayout, AthleteStripeStatus } from 'fad-common';
import { fetchStripeStatus, startStripeOnboarding } from '@/lib/api';
import { formatCents } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';
import { ComingSoonLabel } from '@/components/ui/ComingSoonLabel';

type CardState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; status: AthleteStripeStatus };

// Athlete-facing Stripe connection + payout card. Rendered only in the api-mode
// manage editor (owner-scoped). ARC never initiates payouts — the payout list is
// read-only observability sourced from recorded `payout.*` webhook events.
export function ConnectStripeCard() {
  const [state, setState] = useState<CardState>({ kind: 'loading' });
  const [redirecting, setRedirecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchStripeStatus()
      .then((status) => {
        if (active) setState({ kind: 'ready', status });
      })
      .catch(() => {
        if (active) setState({ kind: 'error' });
      });
    return () => {
      active = false;
    };
  }, []);

  // One handler for both "Connect" and "Finish setup": the API creates or reuses
  // the account and always returns a fresh single-use onboarding link.
  const connect = async () => {
    setRedirecting(true);
    setActionError(null);
    try {
      const { onboardingUrl } = await startStripeOnboarding();
      window.location.assign(onboardingUrl);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not start Stripe onboarding.');
      setRedirecting(false);
    }
  };

  if (state.kind === 'loading') {
    return (
      <div className="h-28 animate-pulse rounded-card border border-outline-variant bg-surface-container" />
    );
  }

  if (state.kind === 'error') {
    return (
      <CardShell>
        <p className="text-sm text-on-surface-variant">
          We couldn&rsquo;t load your payout status. Refresh to try again.
        </p>
      </CardShell>
    );
  }

  const { status } = state;
  const setupState = getStripeSetupState(status);

  if (setupState === 'ready') {
    return (
      <CardShell
        icon="check"
        tone="success"
        title="Ready to receive donations"
        body="Supporters can donate on your public page. Funds go straight to your Stripe account, and ARC never holds your money."
      >
        <PayoutList payouts={status.recentPayouts} />
      </CardShell>
    );
  }

  const copy = SETUP_STATE_COPY[setupState];
  return (
    <CardShell
      icon="info"
      tone="attention"
      title={copy.title}
      body={copy.body}
    >
      <button
        type="button"
        onClick={connect}
        disabled={redirecting}
        className="label-bold inline-flex items-center gap-2 rounded-pill bg-primary px-5 py-2.5 text-on-primary transition-all hover:bg-primary-strong disabled:opacity-60"
      >
        <Icon name={redirecting ? 'history' : 'external'} className="h-4 w-4" />
        {redirecting ? 'Redirecting…' : copy.actionLabel}
      </button>
      {actionError ? <p className="mt-3 text-sm text-error">{actionError}</p> : null}
    </CardShell>
  );
}

function PayoutList({ payouts }: { payouts: AthletePayout[] }) {
  if (payouts.length === 0) {
    return (
      <p className="mt-4 text-sm text-on-surface-variant">
        No payouts yet. Stripe pays out on your account&rsquo;s schedule.
      </p>
    );
  }
  return (
    <div className="mt-5">
      <p className="label-bold mb-2 text-on-surface">Recent payouts</p>
      <ul className="divide-y divide-outline-variant/60 overflow-hidden rounded-input border border-outline-variant">
        {payouts.map((payout) => (
          <li
            key={payout.stripePayoutId}
            className="flex items-center justify-between gap-4 bg-surface-container-lowest px-4 py-3 text-sm"
          >
            <span className="font-bold text-on-surface">
              {formatCents(payout.amountCents, 'CAD')}
            </span>
            <span className="flex items-center gap-3 text-on-surface-variant">
              <span>{PAYOUT_STATUS_LABEL[payout.payoutStatus] ?? payout.payoutStatus}</span>
              {payout.arrivalDate ? (
                <span className="text-xs">
                  {new Date(payout.arrivalDate).toLocaleDateString()}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  IN_TRANSIT: 'In transit',
  PAID: 'Paid',
  FAILED: 'Failed',
  CANCELED: 'Canceled',
};

type StripeSetupState =
  | 'not_connected'
  | 'onboarding_incomplete'
  | 'payouts_pending'
  | 'ready';

const SETUP_STATE_COPY: Record<
  Exclude<StripeSetupState, 'ready'>,
  { title: string; body: string; actionLabel: string }
> = {
  not_connected: {
    title: 'Connect Stripe to receive donations',
    body: 'Set up a Stripe account so supporters can back you. Funds go directly to you, and ARC takes no fee.',
    actionLabel: 'Connect Stripe',
  },
  onboarding_incomplete: {
    title: 'Finish setting up payments',
    body: 'Your Stripe account needs a few more details before supporters can donate.',
    actionLabel: 'Finish setup',
  },
  payouts_pending: {
    title: 'Finish setting up payouts',
    body: 'Your account can accept card payments, but Stripe still needs payout details before donations go live.',
    actionLabel: 'Finish payouts',
  },
};

function getStripeSetupState(status: AthleteStripeStatus): StripeSetupState {
  if (!status.stripeConnected) return 'not_connected';
  if (!status.chargesEnabled) return 'onboarding_incomplete';
  if (!status.payoutsEnabled) return 'payouts_pending';
  return 'ready';
}

function CardShell({
  icon,
  tone = 'neutral',
  title,
  body,
  children,
}: {
  icon?: 'check' | 'info';
  tone?: 'success' | 'attention' | 'neutral';
  title?: string;
  body?: string;
  children?: React.ReactNode;
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'attention'
        ? 'text-secondary'
        : 'text-on-surface-variant';
  return (
    <section className="card-lift rounded-card border border-outline-variant bg-surface-container-lowest p-6 md:p-8">
      {title ? (
        <div className="flex items-start gap-3">
          {icon ? <Icon name={icon} className={`mt-0.5 h-6 w-6 shrink-0 ${toneClass}`} /> : null}
          <div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h2 className="font-display text-xl font-bold text-on-surface">{title}</h2>
              <ComingSoonLabel />
            </div>
            {body ? <p className="mt-1 text-sm text-on-surface-variant">{body}</p> : null}
          </div>
        </div>
      ) : null}
      {children ? <div className={title ? 'mt-5' : ''}>{children}</div> : null}
    </section>
  );
}
