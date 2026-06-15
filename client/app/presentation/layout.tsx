import type { ReactNode } from 'react';

export default function PresentationLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        /* Hide global chrome while the deck owns the viewport. */
        body > header,
        body > footer,
        body > nav {
          display: none !important;
        }
        body > main {
          padding-bottom: 0 !important;
        }
        @media print {
          body { background: #ffffff !important; }
        }
      `}</style>
      <div className="presentation-root fixed inset-0 z-50">{children}</div>
    </>
  );
}
