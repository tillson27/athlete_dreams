'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PlatformRole, type AdminUserDetail } from 'fad-common';
import {
  deleteAdminUser,
  fetchAdminUserDetail,
  updateAdminUserRoles,
} from '@/lib/api';
import { RoleBadges } from '@/app/admin/_components/RoleBadges';

const roleOptions = Object.values(PlatformRole);

export default function AdminUserDetailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') ?? '';
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<PlatformRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAdminUserDetail(userId)
      .then((response) => {
        if (mounted) {
          setUser(response);
          setSelectedRoles(response.roles);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'User could not load.');
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
  }, [userId]);

  const selectedRoleSet = useMemo(() => new Set(selectedRoles), [selectedRoles]);

  async function saveRoles() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await updateAdminUserRoles(userId, { roles: selectedRoles });
      setUser(response);
      setSelectedRoles(response.roles);
      setMessage('Roles saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Roles could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    if (!window.confirm('Delete this user?')) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await deleteAdminUser(userId);
      router.push('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User could not be deleted.');
      setSaving(false);
    }
  }

  function toggleRole(role: PlatformRole) {
    setSelectedRoles((current) =>
      current.includes(role)
        ? current.filter((candidate) => candidate !== role)
        : [...current, role]
    );
  }

  if (loading) {
    return <UserDetailLoading />;
  }

  if (!user) {
    return (
      <section className="grid gap-4">
        <h1 className="font-display text-3xl font-bold">User</h1>
        <div className="rounded-[8px] border border-error/30 bg-surface-container-lowest p-4 text-error">
          {error ?? 'User not found.'}
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <div>
        <p className="text-sm font-semibold uppercase text-on-surface-variant">User Detail</p>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{user.displayName}</h1>
      </div>

      {message ? (
        <div className="rounded-[8px] border border-success/30 bg-surface-container-lowest p-4 text-success">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[8px] border border-error/30 bg-surface-container-lowest p-4 text-error">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[8px] border border-outline-variant bg-surface-container-lowest p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[8px] bg-surface-container text-lg font-bold">
              {initials(user.displayName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{user.email}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{user.displayName}</p>
              <div className="mt-3">
                <RoleBadges roles={user.roles} />
              </div>
            </div>
          </div>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <DetailItem label="Email verified" value={formatDate(user.emailVerifiedAt)} />
            <DetailItem label="Joined" value={formatDate(user.createdAt)} />
            <DetailItem label="Updated" value={formatDate(user.updatedAt)} />
            <DetailItem label="Athlete slug" value={user.athleteSlug ?? 'None'} />
            <DetailItem label="Published" value={formatDate(user.publishedAt)} />
          </dl>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[8px] border border-outline-variant bg-surface-container-lowest p-5">
            <h2 className="text-lg font-bold">Roles</h2>
            <div className="mt-4 grid gap-3">
              {roleOptions.map((role) => (
                <label key={role} className="flex items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={selectedRoleSet.has(role)}
                    onChange={() => toggleRole(role)}
                    className="h-4 w-4 accent-primary"
                  />
                  {role}
                </label>
              ))}
            </div>
            <button
              type="button"
              onClick={saveRoles}
              disabled={saving}
              className="mt-5 min-h-10 rounded-pill bg-secondary px-4 text-sm font-semibold text-on-secondary disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant"
            >
              {saving ? 'Saving' : 'Save Roles'}
            </button>
          </div>

          <div className="rounded-[8px] border border-error/30 bg-surface-container-lowest p-5">
            <h2 className="text-lg font-bold text-error">Delete User</h2>
            <button
              type="button"
              onClick={deleteUser}
              disabled={saving}
              className="mt-4 min-h-10 rounded-pill bg-error px-4 text-sm font-semibold text-on-error disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete User
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function UserDetailLoading() {
  return (
    <section className="grid gap-4">
      <div className="h-9 w-48 animate-pulse rounded-pill bg-surface-container" />
      <div className="h-80 animate-pulse rounded-[8px] bg-surface-container" />
    </section>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
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
