'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DATA_SOURCE } from '@/lib/dataSource';
import { DonateWidget } from './DonateWidget';

// The "Back this athlete" CTA. In api mode with an ACTIVE campaign it opens the
// donation widget; otherwise it falls back to the existing /support teaser (mock
// builds, or an athlete with no active campaign). The parent already gates on
// profile.supportEnabled, so this only decides donate-widget vs teaser.
export function BackThisAthleteCta({
  athleteName,
  campaignId,
  className,
  label = 'Back this athlete',
}: {
  athleteName: string;
  campaignId?: string;
  className: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const canDonate = DATA_SOURCE === 'api' && Boolean(campaignId);

  if (!canDonate || !campaignId) {
    return (
      <Link href="/support" className={className}>
        {label}
      </Link>
    );
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      {open ? (
        <DonateWidget
          campaignId={campaignId}
          athleteName={athleteName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
