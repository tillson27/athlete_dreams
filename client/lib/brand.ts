/**
 * Single source of truth for the Athlete Arc mark.
 *
 * Every surface that draws the logo — `components/site/Logo.tsx`, `app/icon.tsx`,
 * `app/apple-icon.tsx`, `app/opengraph-image.tsx` — must consume these constants
 * rather than inlining paths or hexes. Three hand-maintained copies of the mark
 * previously drifted out of sync.
 *
 * Two constraints shape the path data, and both are easy to undo by accident:
 *
 * 1. Curves are cubic Béziers rather than SVG arc (`A`) commands because Satori,
 *    which rasterizes the icon and share card, renders `C` reliably and `A`
 *    inconsistently.
 *
 * 2. The letter is three disjoint fragments — apex cap, left leg, right leg —
 *    with the crescent's gap band already subtracted. The gap must reveal
 *    whatever sits behind the mark (paper, ink, or hero photography), so it
 *    cannot be a filled halo. Nor can it be a reversed-winding hole: under both
 *    `nonzero` and `evenodd`, the part of the gap band that falls outside the
 *    letter would render as filled ink. Subtracting the band up front is the only
 *    form that stays fill-only and background-agnostic.
 *
 * Regenerate rather than hand-edit: the fragment edges are exact arcs of the two
 * circles the crescent is built from, offset by the gap width.
 */

export const BRAND_NAME_FULL = 'ATHLETE ARC';
export const BRAND_NAME_SHORT = 'ARC';

/** The one public contact address. Every surface that shows an email reads this. */
export const BRAND_CONTACT_EMAIL = 'info@athletearc.ca';

export const BRAND_MARK_VIEW_BOX = '0 0 124 67';
export const BRAND_MARK_WIDTH = 124;
export const BRAND_MARK_HEIGHT = 67;

export const BRAND_MARK_LETTER_PATH =
  'M53 0 L71 0 L84.89 32.23 C79.67 30.39 74.25 29.18 68.75 28.63 L62 12 L55.25 28.63 C49.75 29.18 44.33 30.39 39.11 32.23 Z ' +
  'M33.05 46.3 L25 65 L40.5 65 L49.72 42.26 C44.05 43.06 38.47 44.42 33.05 46.3 Z ' +
  'M74.28 42.26 L83.5 65 L99 65 L90.95 46.3 C85.53 44.42 79.95 43.06 74.28 42.26 Z';

export const BRAND_MARK_ARC_PATH =
  'M2 65 C14.11 43.21 37.07 29.7 62 29.7 C86.93 29.7 109.89 43.21 122 65 C106.13 49 84.53 40 62 40 C39.47 40 17.87 49 2 65 Z';

export const BRAND_INK_COLOR = '#181c1e';
export const BRAND_PAPER_COLOR = '#f7fafc';
export const BRAND_ARC_COLOR = '#ff5f1f';

export function brandMarkWidthForHeight(markHeight: number): number {
  return Math.round((markHeight * BRAND_MARK_WIDTH) / BRAND_MARK_HEIGHT);
}
