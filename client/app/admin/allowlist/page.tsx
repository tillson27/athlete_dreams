'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import type { AdminAllowlistEntry } from 'fad-common';
import {
  addAdminAllowlistEntry,
  deleteAdminAllowlistEntry,
  fetchAdminAllowlist,
} from '@/lib/api';
import {
  AdminEmptyRow,
  AdminError,
  AdminHeaderCell,
  AdminLoadingBlock,
  AdminPageTitle,
  AdminStatusBadge,
  formatAdminDate,
} from '@/app/admin/_components/AdminDisplay';

export default function AdminAllowlistPage() {
  const [entries, setEntries] = useState<AdminAllowlistEntry[]>([]);
  const [isEnforced, setIsEnforced] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshAllowlist() {
    const response = await fetchAdminAllowlist();
    setEntries(response.entries);
    setIsEnforced(response.isEnforced);
  }

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    fetchAdminAllowlist()
      .then((response) => {
        if (mounted) {
          setEntries(response.entries);
          setIsEnforced(response.isEnforced);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Allowlist could not load.');
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
  }, []);

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newEntry.trim()) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addAdminAllowlistEntry({ entry: newEntry });
      setNewEntry('');
      await refreshAllowlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Entry could not be added.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteEntry(entryId: string) {
    setSaving(true);
    setError(null);
    try {
      await deleteAdminAllowlistEntry(entryId);
      await refreshAllowlist();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Entry could not be deleted.');
      await refreshAllowlist().catch(() => undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <AdminPageTitle eyebrow="Admin" title="Allowlist" />
        <AdminStatusBadge
          label={isEnforced ? 'Enforced' : 'Open - anyone can sign up'}
          tone={isEnforced ? 'success' : 'neutral'}
        />
      </div>

      <form
        onSubmit={submitEntry}
        className="grid gap-3 rounded-[8px] border border-outline-variant bg-surface-container-lowest p-4 md:grid-cols-[1fr_auto]"
      >
        <label className="grid gap-1 text-sm font-semibold">
          Entry
          <input
            value={newEntry}
            onChange={(event) => setNewEntry(event.target.value)}
            className="min-h-11 rounded-input border border-outline-variant bg-surface px-3 font-normal outline-none focus:border-focus"
            placeholder="founder@example.com or @example.com"
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="self-end min-h-11 rounded-pill bg-secondary px-5 text-sm font-semibold text-on-secondary disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant"
        >
          Add
        </button>
      </form>

      {error ? <AdminError message={error} /> : null}
      {loading ? (
        <AdminLoadingBlock />
      ) : (
        <div className="overflow-x-auto rounded-[8px] border border-outline-variant bg-surface-container-lowest">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="border-b border-outline-variant bg-surface-container-low">
              <tr>
                <AdminHeaderCell>Entry</AdminHeaderCell>
                <AdminHeaderCell>Source</AdminHeaderCell>
                <AdminHeaderCell>Created</AdminHeaderCell>
                <AdminHeaderCell>Action</AdminHeaderCell>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <AdminEmptyRow colSpan={4} message="No allowlist entries found." />
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-outline-variant/70">
                    <td className="px-4 py-4 font-semibold">{entry.entry}</td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge
                        label={entry.source.toUpperCase()}
                        tone={entry.source === 'db' ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="px-4 py-4">{formatAdminDate(entry.createdAt)}</td>
                    <td className="px-4 py-4">
                      {entry.source === 'db' ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => deleteEntry(entry.id)}
                          className="min-h-9 rounded-pill bg-error px-3 text-xs font-semibold text-on-error disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-on-surface-variant">Locked</span>
                      )}
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
