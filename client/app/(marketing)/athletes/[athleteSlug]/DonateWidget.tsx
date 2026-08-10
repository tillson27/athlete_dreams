'use client';

import { useState } from 'react';
import { createDonation } from '@/lib/api';
import { formatCents } from '@/lib/format';
import { Icon } from '@/components/ui/Icon';

const PRESET_AMOUNTS_CENTS = [2500, 5000, 10000];
const MINIMUM_CENTS = 500; // $5 CAD; the API enforces DONATION_MINIMUM_CENTS too.

// Donor donation entry: pick an amount (presets + custom), optional message and
// anonymity, then redirect to the Stripe-hosted Checkout page. Funds go directly
// to the athlete (non-custodial) — ARC never holds the money.
export function DonateWidget({
  campaignId,
  athleteName,
  onClose,
}: {
  campaignId: string;
  athleteName: string;
  onClose: () => void;
}) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(PRESET_AMOUNTS_CENTS[1]);
  const [customValue, setCustomValue] = useState('');
  const [supporterName, setSupporterName] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customCents = customValue.trim() ? Math.round(Number(customValue) * 100) : null;
  const amountCents = customCents !== null && !Number.isNaN(customCents) ? customCents : selectedPreset;
  const amountValid = amountCents !== null && amountCents >= MINIMUM_CENTS;
  const canSubmit = amountValid && supporterName.trim().length > 0 && !submitting;

  const submit = async () => {
    if (!canSubmit || amountCents === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const { checkoutUrl } = await createDonation({
        campaignId,
        supporterDisplayName: supporterName.trim(),
        donationAmountCents: amountCents,
        donationMessage: message.trim() || undefined,
        isAnonymous,
    });
      window.location.assign(checkoutUrl);
    } catch (cause) {
      setError(toDonationError(cause));
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Back ${athleteName}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-card bg-surface-container-lowest p-6 shadow-xl sm:rounded-card md:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-on-surface">Back {athleteName}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Choose an amount. You&rsquo;ll finish securely on Stripe.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS_CENTS.map((preset) => {
            const active = customValue.trim() === '' && selectedPreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset);
                  setCustomValue('');
                }}
                className={`rounded-input border px-3 py-3 text-sm font-bold transition-colors ${
                  active
                    ? 'border-primary bg-primary-container/20 text-on-surface'
                    : 'border-outline-variant text-on-surface-variant hover:border-primary'
                }`}
              >
                {formatCents(preset, 'CAD')}
              </button>
            );
          })}
        </div>

        <label className="mt-3 block">
          <span className="sr-only">Custom amount in dollars</span>
          <div className="flex items-center gap-2 rounded-input border border-outline-variant bg-surface-container-low px-3 py-2 focus-within:border-secondary">
            <span className="text-sm font-bold text-on-surface-variant">$</span>
            <input
              type="number"
              inputMode="decimal"
              min={MINIMUM_CENTS / 100}
              step="1"
              placeholder="Custom amount (CAD)"
              value={customValue}
              onChange={(event) => setCustomValue(event.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
            <span className="text-xs text-on-surface-variant">CAD</span>
          </div>
        </label>
        {!amountValid && (customValue.trim() !== '' || amountCents !== null) ? (
          <p className="mt-1 text-xs text-error">Minimum donation is {formatCents(MINIMUM_CENTS, 'CAD')}.</p>
        ) : null}

        <input
          type="text"
          placeholder="Your name"
          value={supporterName}
          onChange={(event) => setSupporterName(event.target.value)}
          className="mt-3 w-full rounded-input border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-secondary"
        />
        <textarea
          placeholder="Add a message (optional)"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={2}
          className="mt-3 w-full rounded-input border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-secondary"
        />
        <label className="mt-3 flex items-center gap-2 text-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(event) => setIsAnonymous(event.target.checked)}
            className="h-4 w-4 rounded border-outline-variant"
          />
          Donate anonymously
        </label>

        {error ? <p className="mt-4 text-sm text-error">{error}</p> : null}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-button bg-primary-container px-6 text-sm font-bold text-on-primary shadow-md transition-all hover:bg-primary active:scale-95 disabled:opacity-50"
        >
          <Icon name={submitting ? 'history' : 'heart'} className="h-4 w-4" />
          {submitting
            ? 'Redirecting…'
            : amountValid && amountCents !== null
              ? `Donate ${formatCents(amountCents, 'CAD')}`
              : 'Donate'}
        </button>

        {/* [STRICT] legal disclosure at the point of donation (context §5). */}
        <p className="mt-4 text-[11px] leading-relaxed text-on-surface-variant">
          ARC is not a registered charity and donations are not tax-deductible. Funds go directly to
          the athlete, who is the merchant of record and responsible for any taxes; ARC does not
          control how the money is spent.
        </p>
      </div>
    </div>
  );
}

function toDonationError(cause: unknown): string {
  if (cause instanceof Error && cause.message.includes('not accepting donations')) {
    return 'This athlete is not accepting donations yet.';
  }
  if (cause instanceof Error && cause.message.includes('minimum')) {
    return 'Choose a donation amount above the minimum.';
  }
  return 'Could not start checkout. Please try again.';
}
