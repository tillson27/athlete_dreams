const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const cadFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

export function formatCents(amountCents: number, currencyCode: 'USD' | 'CAD' = 'USD'): string {
  const formatter = currencyCode === 'CAD' ? cadFormatter : usdFormatter;
  return formatter.format(amountCents / 100);
}

export function formatProgress(raisedCents: number, targetCents: number): number {
  if (targetCents <= 0) return 0;
  return Math.min(100, Math.round((raisedCents / targetCents) * 100));
}

export function formatSport(sport: string): string {
  return sport
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Calendar-day delta between now and an ISO timestamp; clamps at 0 once elapsed.
// Using a fixed reference for SSR/build determinism is the caller's responsibility.
export function daysUntil(isoDateTime: string, now: Date = new Date()): number {
  const target = new Date(isoDateTime).getTime();
  if (Number.isNaN(target)) return 0;
  const diffMs = target - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}
