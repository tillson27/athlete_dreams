'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PlatformRole, type AdminUserSummary } from 'fad-common';
import { fetchAdminUsers } from '@/lib/api';
import { RoleBadges } from '@/app/admin/_components/RoleBadges';

const roleOptions = Object.values(PlatformRole);

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<PlatformRole | ''>('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
      setCursor(undefined);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAdminUsers({
      search: debouncedSearch || undefined,
      role: roleFilter || undefined,
      cursor,
      limit: 25,
    })
      .then((response) => {
        if (mounted) {
          setUsers(response.items);
          setNextCursor(response.nextCursor);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Users could not load.');
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
  }, [cursor, debouncedSearch, roleFilter]);

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-semibold uppercase text-on-surface-variant">Admin</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Users</h1>
      </div>

      <div className="grid gap-3 rounded-[8px] border border-outline-variant bg-surface-container-lowest p-4 md:grid-cols-[1fr_220px]">
        <label className="grid gap-1 text-sm font-semibold">
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-h-11 rounded-input border border-outline-variant bg-surface px-3 font-normal outline-none focus:border-focus"
            placeholder="Email or name"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Role
          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as PlatformRole | '');
              setCursor(undefined);
            }}
            className="min-h-11 rounded-input border border-outline-variant bg-surface px-3 font-normal outline-none focus:border-focus"
          >
            <option value="">All roles</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <div className="rounded-[8px] border border-error/30 bg-surface-container-lowest p-4 text-error">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[8px] border border-outline-variant bg-surface-container-lowest">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="border-b border-outline-variant bg-surface-container-low">
            <tr>
              <HeaderCell>Email</HeaderCell>
              <HeaderCell>Name</HeaderCell>
              <HeaderCell>Roles</HeaderCell>
              <HeaderCell>Verified</HeaderCell>
              <HeaderCell>Joined</HeaderCell>
              <HeaderCell>Profile</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.userId}
                  onClick={() => router.push(`/admin/users/detail?userId=${user.userId}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/admin/users/detail?userId=${user.userId}`);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer border-b border-outline-variant/70 transition-colors hover:bg-surface-container-low"
                >
                  <BodyCell>
                    <span className="font-semibold">{user.email}</span>
                  </BodyCell>
                  <BodyCell>{user.displayName}</BodyCell>
                  <BodyCell>
                    <RoleBadges roles={user.roles} />
                  </BodyCell>
                  <BodyCell>{user.emailVerifiedAt ? 'Yes' : 'No'}</BodyCell>
                  <BodyCell>{formatDate(user.createdAt)}</BodyCell>
                  <BodyCell>{user.hasAthleteProfile ? 'Athlete' : 'None'}</BodyCell>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-bold uppercase text-on-surface-variant">
      {children}
    </th>
  );
}

function BodyCell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4 align-middle">{children}</td>;
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <tr key={index} className="border-b border-outline-variant/70">
          <td colSpan={6} className="px-4 py-4">
            <div className="h-5 animate-pulse rounded-pill bg-surface-container" />
          </td>
        </tr>
      ))}
    </>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'No';
  }
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
