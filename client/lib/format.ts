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

const feedDateFormatter = new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Public API contract: renders a community-feed item's source date as a stable
 * date stamp, or null when the item carries no date. Formatted in UTC so the
 * server and client render identically (no hydration mismatch).
 */
export function formatFeedDate(occurredAt: string | null | undefined): string | null {
  if (!occurredAt) return null;
  const parsed = new Date(occurredAt);
  return Number.isNaN(parsed.getTime()) ? null : feedDateFormatter.format(parsed);
}

export function formatSport(sport: string): string {
  return sport
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
