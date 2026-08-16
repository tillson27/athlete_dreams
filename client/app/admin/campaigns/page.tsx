'use client';

import { useEffect, useState } from 'react';
import { CampaignStatus, type AdminCampaignItem } from 'fad-common';
import { adminUpdateCampaignStatus, fetchAdminCampaigns } from '@/lib/api';
import { formatCents, formatSport } from '@/lib/format';
import {
  AdminEmptyRow,
  AdminError,
  AdminHeaderCell,
  AdminLoadingBlock,
  AdminPageTitle,
  AdminStatusBadge,
  campaignStatusTone,
  formatAdminDate,
} from '@/app/admin/_components/AdminDisplay';

const campaignStatuses = Object.values(CampaignStatus);

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<AdminCampaignItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>('');
  const [updatingCampaignId, setUpdatingCampaignId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchAdminCampaigns({ status: statusFilter || undefined, limit: 100 })
      .then((response) => {
        setCampaigns(response.items);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Campaigns could not load.');
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  async function updateStatus(campaignId: string, campaignStatus: CampaignStatus) {
    setUpdatingCampaignId(campaignId);
    setError(null);
    try {
      await adminUpdateCampaignStatus(campaignId, { campaignStatus });
      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.campaignId === campaignId ? { ...campaign, campaignStatus } : campaign
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Campaign status could not be updated.');
    } finally {
      setUpdatingCampaignId(null);
    }
  }

  return (
    <section className="grid gap-5">
      <AdminPageTitle eyebrow="Admin" title="Campaigns" />
      <label className="grid max-w-xs gap-1 text-sm font-semibold">
        Status
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as CampaignStatus | '')}
          className="min-h-11 rounded-input border border-outline-variant bg-surface px-3 font-normal outline-none focus:border-focus"
        >
          <option value="">All statuses</option>
          {campaignStatuses.map((status) => (
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
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="border-b border-outline-variant bg-surface-container-low">
              <tr>
                <AdminHeaderCell>Title</AdminHeaderCell>
                <AdminHeaderCell>Type</AdminHeaderCell>
                <AdminHeaderCell>Status</AdminHeaderCell>
                <AdminHeaderCell>Funding</AdminHeaderCell>
                <AdminHeaderCell>Athlete</AdminHeaderCell>
                <AdminHeaderCell>Created</AdminHeaderCell>
                <AdminHeaderCell>Override</AdminHeaderCell>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <AdminEmptyRow colSpan={7} message="No campaigns found." />
              ) : (
                campaigns.map((campaign) => {
                  const percent =
                    campaign.targetAmountCents > 0
                      ? Math.min(
                          Math.round(
                            (campaign.raisedAmountCents / campaign.targetAmountCents) * 100
                          ),
                          100
                        )
                      : 0;
                  return (
                    <tr key={campaign.campaignId} className="border-b border-outline-variant/70">
                      <td className="px-4 py-4 font-semibold">{campaign.campaignTitle}</td>
                      <td className="px-4 py-4">{formatSport(campaign.campaignType)}</td>
                      <td className="px-4 py-4">
                        <AdminStatusBadge
                          label={campaign.campaignStatus}
                          tone={campaignStatusTone(campaign.campaignStatus)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="min-w-36">
                          <div className="text-xs text-on-surface-variant">
                            {formatCents(campaign.raisedAmountCents, 'CAD')} /{' '}
                            {formatCents(campaign.targetAmountCents, 'CAD')}
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-pill bg-surface-container">
                            <div
                              className="h-full rounded-pill bg-primary"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">{campaign.athleteFullName}</td>
                      <td className="px-4 py-4">{formatAdminDate(campaign.createdAt)}</td>
                      <td className="px-4 py-4">
                        <select
                          value={campaign.campaignStatus}
                          disabled={updatingCampaignId === campaign.campaignId}
                          onChange={(event) =>
                            updateStatus(campaign.campaignId, event.target.value as CampaignStatus)
                          }
                          className="min-h-9 rounded-input border border-outline-variant bg-surface px-2 text-xs font-semibold"
                        >
                          {campaignStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
