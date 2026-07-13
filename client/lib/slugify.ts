// Canonical slug derivation used for session-owned profile routing.
export function slugifyName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Best-effort inverse for display when a slug has no roster entry yet.
export function nameFromSlug(athleteSlug: string): string {
  return athleteSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
