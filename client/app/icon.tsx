import { ImageResponse } from 'next/og';
import {
  BRAND_ARC_COLOR,
  BRAND_INK_COLOR,
  BRAND_MARK_ARC_PATH,
  BRAND_MARK_LETTER_PATH,
  BRAND_MARK_VIEW_BOX,
  BRAND_PAPER_COLOR,
  brandMarkWidthForHeight,
} from '@/lib/brand';

// Render at build time so the icon ships in the static export (`output: 'export'`).
export const dynamic = 'force-static';

export const size = { width: 256, height: 256 };
export const contentType = 'image/png';

// The mark is wide and short (124×67), so it must be sized off width to stay
// legible at 16px tab scale — height-driven sizing leaves it a thin sliver.
const markHeight = 130;

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: BRAND_PAPER_COLOR,
        }}
      >
        <svg
          width={brandMarkWidthForHeight(markHeight)}
          height={markHeight}
          viewBox={BRAND_MARK_VIEW_BOX}
        >
          <path d={BRAND_MARK_LETTER_PATH} fill={BRAND_INK_COLOR} />
          <path d={BRAND_MARK_ARC_PATH} fill={BRAND_ARC_COLOR} />
        </svg>
      </div>
    ),
    size,
  );
}
