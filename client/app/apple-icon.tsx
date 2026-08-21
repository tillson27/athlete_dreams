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

// Render at build time so the touch icon ships in the static export (`output: 'export'`).
export const dynamic = 'force-static';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const markHeight = 88;

export default function AppleIcon() {
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
