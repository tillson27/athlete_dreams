'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { AdminAthleteItem } from 'fad-common';
import { adminPublishAthlete, fetchAdminAthletes } from '@/lib/api';
import { formatSport } from '@/lib/format';
import {
  AdminEmptyRow,
  AdminError,
  AdminHeaderCell,
  AdminLoadingBlock,
  AdminPageTitle,
  AdminStatusBadge,
  formatAdminDate,
} from '@/app/admin/_components/AdminDisplay';

type PublishedFilter = 'all' | 'true' | 'false';

function fetchAthleteRows(published: PublishedFilter) {
  return fetchAdminAthletes({
    published: published === 'all' ? undefined : published,
    limit: 100,
  });
}

export default function AdminAthletesPage() {
  const [athletes, setAthletes] = useState<AdminAthleteItem[]>([]);
  const [published, setPublished] = useState<PublishedFilter>('all');
  const [loading, setLoading] = useState(true);
  const [updatingAthleteId, setUpdatingAthleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    fetchAthleteRows(published)
      .then((response) => {
        if (mounted) {
          setAthletes(response.items);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Athletes could not load.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [published]);

  async function togglePublished(athlete: AdminAthleteItem) {
    const publish = !athlete.publishedAt;
    setUpdatingAthleteId(athlete.athleteId);
    setError(null);
    try {
      await adminPublishAthlete(athlete.athleteId, { publish });
      await fetchAthleteRows(published).then((response) => setAthletes(response.items));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Athlete could not be updated.');
    } finally {
      setUpdatingAthleteId(null);
    }
  }

  return (
    <section className="grid gap-5">
      <AdminPageTitle eyebrow="Admin" title="Athletes" />
      <div className="flex flex-wrap gap-2">
        {[
          ['all', 'All'],
          ['true', 'Published'],
          ['false', 'Unpublished'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPublished(value as PublishedFilter)}
            className={`min-h-10 rounded-pill px-4 text-sm font-semibold ${
              published === value
                ? 'bg-secondary text-on-secondary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {error ? <AdminError message={error} /> : null}
      {loading ? (
        <AdminLoadingBlock />
      ) : (
        <div className="overflow-x-auto rounded-[8px] border border-outline-variant bg-surface-container-lowest">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="border-b border-outline-variant bg-surface-container-low">
              <tr>
                <AdminHeaderCell>Slug</AdminHeaderCell>
                <AdminHeaderCell>Name</AdminHeaderCell>
                <AdminHeaderCell>Sport</AdminHeaderCell>
                <AdminHeaderCell>Published</AdminHeaderCell>
                <AdminHeaderCell>Stripe</AdminHeaderCell>
                <AdminHeaderCell>Created</AdminHeaderCell>
                <AdminHeaderCell>Actions</AdminHeaderCell>
              </tr>
            </thead>
            <tbody>
              {athletes.length === 0 ? (
                <AdminEmptyRow colSpan={7} message="No athletes found." />
              ) : (
                athletes.map((athlete) => (
                  <tr key={athlete.athleteId} className="border-b border-outline-variant/70">
                    <td className="px-4 py-4">
                      <Link
                        href={`/athletes/${athlete.athleteSlug}`}
                        target="_blank"
                        className="font-semibold text-focus"
                      >
                        {athlete.athleteSlug}
                      </Link>
                    </td>
                    <td className="px-4 py-4">{athlete.fullName}</td>
                    <td className="px-4 py-4">{formatSport(athlete.primarySport)}</td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge
                        label={athlete.publishedAt ? 'Published' : 'Draft'}
                        tone={athlete.publishedAt ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge
                        label={athlete.stripeChargesEnabledAt ? 'Connected' : 'Missing'}
                        tone={athlete.stripeChargesEnabledAt ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="px-4 py-4">{formatAdminDate(athlete.createdAt)}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={updatingAthleteId === athlete.athleteId}
                        onClick={() => togglePublished(athlete)}
                        className="min-h-9 rounded-pill bg-secondary px-3 text-xs font-semibold text-on-secondary disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant"
                      >
                        {athlete.publishedAt ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
