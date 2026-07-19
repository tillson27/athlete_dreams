import { ImageResponse } from 'next/og';

// Render at build time so the card ships in the static export (`output: 'export'`).
export const dynamic = 'force-static';

export const alt = 'ARC — a home for your athletic story';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function OgArcMark() {
  return (
    <svg width="88" height="88" viewBox="0 0 40 40" fill="none">
      <rect x="2" y="2" width="36" height="36" rx="8" fill="#fff8ef" />
      <path
        d="M7 25.5C10.5 14.4 20.2 7.8 33.5 7.5"
        stroke="#ff5f1f"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <path
        d="M11.5 30.5 18.9 14.2c.5-1.2 2.1-1.2 2.7 0l7.2 16.3h-5.1l-3.5-8.2-3.6 8.2h-5.1Z"
        fill="#160d09"
      />
      <path
        d="M16.4 24.4c3.9-1.5 7.6-1.2 11 .8"
        stroke="#ab3600"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M26.6 13.5 32 18" stroke="#ff5f1f" strokeWidth="3" strokeLinecap="round" />
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
          <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: 0 }}>ARC</div>
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
