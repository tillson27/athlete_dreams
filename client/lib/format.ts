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
