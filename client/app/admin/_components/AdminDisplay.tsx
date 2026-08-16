import type { ReactNode } from 'react';
import { CampaignStatus, DonationStatus } from 'fad-common';

type AdminStatusTone = 'success' | 'error' | 'focus' | 'primary' | 'neutral';

export function AdminPageTitle({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase text-on-surface-variant">{eyebrow}</p>
      <h1 className="mt-1 font-display text-3xl font-bold">{title}</h1>
    </div>
  );
}

export function AdminError({ message }: { message: string }) {
  return (
    <div className="rounded-[8px] border border-error/30 bg-surface-container-lowest p-4 text-error">
      {message}
    </div>
  );
}

export function AdminLoadingBlock() {
  return <div className="h-72 animate-pulse rounded-[8px] bg-surface-container" />;
}

export function AdminStatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: AdminStatusTone;
}) {
  return (
    <span className={`rounded-pill px-2 py-1 text-xs font-bold ${statusToneClass(tone)}`}>
      {label}
    </span>
  );
}

export function AdminHeaderCell({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-bold uppercase text-on-surface-variant">
      {children}
    </th>
  );
}

export function AdminEmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-on-surface-variant">
        {message}
      </td>
    </tr>
  );
}

export function formatAdminDate(value: string | null): string {
  if (!value) {
    return 'No';
  }
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function campaignStatusTone(status: CampaignStatus): AdminStatusTone {
  switch (status) {
    case CampaignStatus.Active:
      return 'success';
    case CampaignStatus.Funded:
      return 'focus';
    case CampaignStatus.Completed:
      return 'primary';
    case CampaignStatus.Archived:
      return 'neutral';
    case CampaignStatus.Draft:
      return 'neutral';
  }
}

export function donationStatusTone(status: DonationStatus): AdminStatusTone {
  switch (status) {
    case DonationStatus.Succeeded:
      return 'success';
    case DonationStatus.Failed:
      return 'error';
    case DonationStatus.Refunded:
      return 'neutral';
    case DonationStatus.Pending:
      return 'focus';
  }
}

function statusToneClass(tone: AdminStatusTone) {
  switch (tone) {
    case 'success':
      return 'bg-success/10 text-success';
    case 'error':
      return 'bg-error/10 text-error';
    case 'focus':
      return 'bg-focus/10 text-focus';
    case 'primary':
      return 'bg-primary-soft text-on-surface';
    case 'neutral':
      return 'bg-surface-container text-on-surface-variant';
  }
}
