'use client';

import { useEffect, useState } from 'react';
import { DonationStatus, type AdminDonationItem } from 'fad-common';
import { fetchAdminDonations } from '@/lib/api';
import { formatCents } from '@/lib/format';
import {
  AdminEmptyRow,
  AdminError,
  AdminHeaderCell,
  AdminLoadingBlock,
  AdminPageTitle,
  AdminStatusBadge,
  donationStatusTone,
  formatAdminDate,
} from '@/app/admin/_components/AdminDisplay';

const donationStatuses = Object.values(DonationStatus);

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<AdminDonationItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<DonationStatus | ''>('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchAdminDonations({ status: statusFilter || undefined, cursor, limit: 25 })
      .then((response) => {
        setDonations(response.items);
        setNextCursor(response.nextCursor);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Donations could not load.');
      })
      .finally(() => setLoading(false));
  }, [cursor, statusFilter]);

  return (
    <section className="grid gap-5">
      <AdminPageTitle eyebrow="Admin" title="Donations" />
      <label className="grid max-w-xs gap-1 text-sm font-semibold">
        Status
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as DonationStatus | '');
            setCursor(undefined);
          }}
          className="min-h-11 rounded-input border border-outline-variant bg-surface px-3 font-normal outline-none focus:border-focus"
        >
          <option value="">All statuses</option>
          {donationStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      {error ? <AdminError message={error} /> : null}
      {loading ? (
        <AdminLoadingBlock />
      ) : (
        <div className="overflow-x-auto rounded-[8px] border border-outline-variant bg-surface-container-lowest">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="border-b border-outline-variant bg-surface-container-low">
              <tr>
                <AdminHeaderCell>Supporter</AdminHeaderCell>
                <AdminHeaderCell>Email</AdminHeaderCell>
                <AdminHeaderCell>Amount</AdminHeaderCell>
                <AdminHeaderCell>Status</AdminHeaderCell>
                <AdminHeaderCell>Campaign</AdminHeaderCell>
                <AdminHeaderCell>Athlete</AdminHeaderCell>
                <AdminHeaderCell>Date</AdminHeaderCell>
              </tr>
            </thead>
            <tbody>
              {donations.length === 0 ? (
                <AdminEmptyRow colSpan={7} message="No donations found." />
              ) : (
                donations.map((donation) => (
                  <tr key={donation.donationId} className="border-b border-outline-variant/70">
                    <td className="px-4 py-4 font-semibold">{donation.supporterDisplayName}</td>
                    <td className="px-4 py-4">{donation.supporterEmail ?? 'Anonymous'}</td>
                    <td className="px-4 py-4">
                      {formatCents(donation.donationAmountCents, 'CAD')}
                    </td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge
                        label={donation.donationStatus}
                        tone={donationStatusTone(donation.donationStatus)}
                      />
                    </td>
                    <td className="px-4 py-4">{donation.campaignTitle}</td>
                    <td className="px-4 py-4">{donation.athleteFullName}</td>
                    <td className="px-4 py-4">{formatAdminDate(donation.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!nextCursor || loading}
          onClick={() => setCursor(nextCursor ?? undefined)}
          className="min-h-10 rounded-pill bg-secondary px-4 text-sm font-semibold text-on-secondary transition-colors disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant"
        >
          Next
        </button>
      </div>
    </section>
  );
}
