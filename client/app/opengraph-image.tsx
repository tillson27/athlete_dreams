import { ImageResponse } from 'next/og';
import {
  BRAND_ARC_COLOR,
  BRAND_MARK_ARC_PATH,
  BRAND_MARK_LETTER_PATH,
  BRAND_MARK_VIEW_BOX,
  BRAND_PAPER_COLOR,
  brandMarkWidthForHeight,
} from '@/lib/brand';

// Render at build time so the card ships in the static export (`output: 'export'`).
export const dynamic = 'force-static';

export const alt = 'Athlete Arc — a home for your athletic story';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const markHeight = 79;

function OgArcMark() {
  return (
    <svg
      width={brandMarkWidthForHeight(markHeight)}
      height={markHeight}
      viewBox={BRAND_MARK_VIEW_BOX}
    >
      <path d={BRAND_MARK_LETTER_PATH} fill={BRAND_PAPER_COLOR} />
      <path d={BRAND_MARK_ARC_PATH} fill={BRAND_ARC_COLOR} />
    </svg>
  );
}

// Brand-colored share card generated at build time — no binary asset to maintain.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          backgroundColor: '#181c1e',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <OgArcMark />
          <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: 0 }}>ATHLETE ARC</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: 0 }}>
            Your athletic journey.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: 0,
            }}
          >
            <span style={{ color: '#ff5f1f' }}>Your Arc.</span>
            <span style={{ marginLeft: 20 }}>Told in one place.</span>
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 30, color: 'rgba(255,255,255,0.72)' }}>
          Because finish lines are only part of the story — athletearc.ca
        </div>
      </div>
    ),
    size,
  );
}
