/**
 * Single source of truth for the Athlete Arc mark.
 *
 * Every surface that draws the logo — `components/site/Logo.tsx`, `app/icon.tsx`,
 * `app/apple-icon.tsx`, `app/opengraph-image.tsx` — must consume these constants
 * rather than inlining paths or hexes. Three hand-maintained copies of the mark
 * previously drifted out of sync.
 *
 * The arc is expressed as cubic Béziers rather than SVG arc (`A`) commands
 * because Satori, which rasterizes the icon and share card, renders `C` reliably
 * and `A` inconsistently.
 */

export const BRAND_NAME_FULL = 'ATHLETE ARC';
export const BRAND_NAME_SHORT = 'ARC';

/** The one public contact address. Every surface that shows an email reads this. */
export const BRAND_CONTACT_EMAIL = 'info@athletearc.ca';

export const BRAND_MARK_VIEW_BOX = '0 0 120 72';
export const BRAND_MARK_WIDTH = 120;
export const BRAND_MARK_HEIGHT = 72;

export const BRAND_MARK_LETTER_PATH = 'M54 6 L66 6 L91 66 L77.9 66 L60 23 L42.1 66 L29 66 Z';

export const BRAND_MARK_ARC_PATH =
  'M9 62 C18.44 42.43 38.27 30 60 30 C81.73 30 101.56 42.43 111 62 C98.09 47.37 79.51 39 60 39 C40.49 39 21.91 47.37 9 62 Z';

export const BRAND_INK_COLOR = '#181c1e';
export const BRAND_PAPER_COLOR = '#f7fafc';
export const BRAND_ARC_COLOR = '#ff5f1f';

export function brandMarkWidthForHeight(markHeight: number): number {
  return Math.round((markHeight * BRAND_MARK_WIDTH) / BRAND_MARK_HEIGHT);
}
