const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

// Roadmap dates arrive as display prose ("Sept 11, 2026", "October 2026",
// "All winter"). `AthleteEvent.eventStartDate` is a required DATE column used
// only for chronological ordering, so parse best-effort and fall back to a
// stable sentinel; the UI renders `displayDate`, never this value.
export function parseEventStartDate(displayDate: string): Date {
  const direct = new Date(displayDate);
  if (!Number.isNaN(direct.getTime())) return direct;

  const lowered = displayDate.toLowerCase();
  const yearMatch = lowered.match(/(20\d{2})/);
  const year = yearMatch ? Number(yearMatch[1]) : 2026;
  const monthIndex = MONTH_NAMES.findIndex((month) => lowered.includes(month.slice(0, 3)));
  return new Date(Date.UTC(year, monthIndex >= 0 ? monthIndex : 11, 1));
}
