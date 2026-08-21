'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PlatformRole,
  SignupAllowlistStatus,
  type AdminDonationItem,
  type AdminUserDetail,
  type AdminUserStripeStatus,
} from 'fad-common';
import {
  addAdminUserToAllowlist,
  deleteAdminUser,
  fetchAdminUserDetail,
  fetchAdminUserDonations,
  fetchAdminUserStripeStatus,
  markAdminUserEmailVerified,
  resendAdminUserVerification,
  sendAdminUserPasswordReset,
  updateAdminUserRoles,
} from '@/lib/api';
import { RoleBadges } from '@/app/admin/_components/RoleBadges';
import {
  AdminEmptyRow,
  AdminError,
  AdminHeaderCell,
  AdminPageTitle,
  AdminStatusBadge,
  donationStatusTone,
  formatAdminDate,
} from '@/app/admin/_components/AdminDisplay';
import { formatCents } from '@/lib/format';

const roleOptions = Object.values(PlatformRole);

export default function AdminUserDetailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') ?? '';
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<PlatformRole[]>([]);
  const [donations, setDonations] = useState<AdminDonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([fetchAdminUserDetail(userId), fetchAdminUserDonations(userId)])
      .then(([detail, donationPage]) => {
        if (mounted) {
          setUser(detail);
          setSelectedRoles(detail.roles);
          setDonations(donationPage.items);
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

  const runAction = useCallback(
    async (actionKey: string, action: () => Promise<unknown>, successMessage: string) => {
      setBusyAction(actionKey);
      setMessage(null);
      setError(null);
      try {
        const result = await action();
        if (isAdminUserDetail(result)) {
          setUser(result);
          setSelectedRoles(result.roles);
        }
        setMessage(successMessage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'That action could not be completed.');
      } finally {
        setBusyAction(null);
      }
    },
    []
  );

  async function deleteUser() {
    if (!window.confirm('Delete this user?')) {
      return;
    }
    setBusyAction('delete');
    setError(null);
    try {
      await deleteAdminUser(userId);
      router.push('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User could not be deleted.');
      setBusyAction(null);
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
        <AdminPageTitle eyebrow="User Detail" title="User" />
        <AdminError message={error ?? 'User not found.'} />
      </section>
    );
  }

  const isBusy = busyAction !== null;

  return (
    <section className="grid gap-5">
      <AdminPageTitle eyebrow="User Detail" title={user.displayName} />

      {message ? (
        <div className="rounded-[8px] border border-success/30 bg-surface-container-lowest p-4 text-success">
          {message}
        </div>
      ) : null}
      {error ? <AdminError message={error} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          <Panel>
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
              <DetailItem label="Joined" value={formatAdminDate(user.createdAt)} />
              <DetailItem label="Updated" value={formatAdminDate(user.updatedAt)} />
              <DetailItem label="Athlete slug" value={user.athleteSlug ?? 'None'} />
              <DetailItem label="Profile published" value={formatAdminDate(user.publishedAt)} />
            </dl>
          </Panel>

          <AccessPanel
            user={user}
            isBusy={isBusy}
            busyAction={busyAction}
            onResendVerification={() =>
              runAction(
                'resend-verification',
                () => resendAdminUserVerification(userId),
                'Verification email sent.'
              )
            }
            onMarkVerified={() =>
              runAction(
                'mark-verified',
                () => markAdminUserEmailVerified(userId),
                'Email marked as verified.'
              )
            }
            onSendPasswordReset={() =>
              runAction(
                'password-reset',
                () => sendAdminUserPasswordReset(userId),
                'Password reset email sent.'
              )
            }
            onAddToAllowlist={() =>
              runAction(
                'allowlist',
                () => addAdminUserToAllowlist(userId),
                'User added to the sign-up allowlist.'
              )
            }
          />

          <DonationsPanel donations={donations} />
        </div>

        <div className="grid gap-4">
          <Panel>
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
            <ActionButton
              label="Save Roles"
              busyLabel="Saving"
              isBusy={busyAction === 'roles'}
              disabled={isBusy}
              onClick={() =>
                runAction(
                  'roles',
                  () => updateAdminUserRoles(userId, { roles: selectedRoles }),
                  'Roles saved.'
                )
              }
            />
          </Panel>

          <StripePanel userId={userId} hasAthleteProfile={user.hasAthleteProfile} />

          <div className="rounded-[8px] border border-error/30 bg-surface-container-lowest p-5">
            <h2 className="text-lg font-bold text-error">Delete User</h2>
            <button
              type="button"
              onClick={deleteUser}
              disabled={isBusy}
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

function AccessPanel({
  user,
  isBusy,
  busyAction,
  onResendVerification,
  onMarkVerified,
  onSendPasswordReset,
  onAddToAllowlist,
}: {
  user: AdminUserDetail;
  isBusy: boolean;
  busyAction: string | null;
  onResendVerification: () => void;
  onMarkVerified: () => void;
  onSendPasswordReset: () => void;
  onAddToAllowlist: () => void;
}) {
  const isVerified = user.emailVerifiedAt !== null;
  const isBlocked = user.signupAllowlistStatus === SignupAllowlistStatus.Blocked;

  return (
    <Panel>
      <h2 className="text-lg font-bold">Access</h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Why this person can or cannot sign in.
      </p>

      <div className="mt-4 grid gap-3">
        <StatusRow
          label="Email verified"
          badge={
            <AdminStatusBadge
              label={isVerified ? formatAdminDate(user.emailVerifiedAt) : 'Not verified'}
              tone={isVerified ? 'success' : 'error'}
            />
          }
        />
        <StatusRow
          label="Sign-up allowlist"
          badge={
            <AdminStatusBadge
              label={
                !user.signupAllowlistIsEnforced
                  ? 'Not enforced'
                  : isBlocked
                    ? 'Blocked'
                    : 'Allowed'
              }
              tone={!user.signupAllowlistIsEnforced ? 'neutral' : isBlocked ? 'error' : 'success'}
            />
          }
        />
      </div>

      {user.signupAllowlistIsEnforced && isBlocked ? (
        <p className="mt-3 rounded-[8px] bg-surface-container p-3 text-sm text-on-surface-variant">
          Sign-in is refused for this email until it is on the allowlist.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {!isVerified ? (
          <SecondaryButton
            label="Resend verification"
            isBusy={busyAction === 'resend-verification'}
            disabled={isBusy}
            onClick={onResendVerification}
          />
        ) : null}
        {!isVerified ? (
          <SecondaryButton
            label="Mark verified"
            isBusy={busyAction === 'mark-verified'}
            disabled={isBusy}
            onClick={onMarkVerified}
          />
        ) : null}
        <SecondaryButton
          label="Send password reset"
          isBusy={busyAction === 'password-reset'}
          disabled={isBusy}
          onClick={onSendPasswordReset}
        />
        {isBlocked ? (
          <SecondaryButton
            label="Add to allowlist"
            isBusy={busyAction === 'allowlist'}
            disabled={isBusy}
            onClick={onAddToAllowlist}
          />
        ) : null}
      </div>
    </Panel>
  );
}

function StripePanel({
  userId,
  hasAthleteProfile,
}: {
  userId: string;
  hasAthleteProfile: boolean;
}) {
  const [status, setStatus] = useState<AdminUserStripeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    setError(null);
    try {
      setStatus(await fetchAdminUserStripeStatus(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stripe status could not load.');
    } finally {
      setLoading(false);
    }
  }

  if (!hasAthleteProfile) {
    return null;
  }

  return (
    <Panel>
      <h2 className="text-lg font-bold">Stripe</h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Reads live from Stripe. Any onboarding link below is single-use and short-lived.
      </p>

      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}

      {status ? (
        <div className="mt-4 grid gap-3">
          <StatusRow
            label="Connected"
            badge={
              <AdminStatusBadge
                label={status.stripeConnected ? 'Yes' : 'No'}
                tone={status.stripeConnected ? 'success' : 'error'}
              />
            }
          />
          <StatusRow
            label="Charges enabled"
            badge={
              <AdminStatusBadge
                label={status.chargesEnabled ? 'Yes' : 'No'}
                tone={status.chargesEnabled ? 'success' : 'error'}
              />
            }
          />
          <StatusRow
            label="Payouts enabled"
            badge={
              <AdminStatusBadge
                label={status.payoutsEnabled ? 'Yes' : 'No'}
                tone={status.payoutsEnabled ? 'success' : 'error'}
              />
            }
          />

          {status.stripeAccountId ? (
            <a
              href={`https://dashboard.stripe.com/connect/accounts/${status.stripeAccountId}`}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm font-semibold text-primary underline"
            >
              {status.stripeAccountId}
            </a>
          ) : null}

          {status.onboardingUrl ? (
            <div className="grid gap-2 rounded-[8px] bg-surface-container p-3">
              <p className="text-xs font-bold uppercase text-on-surface-variant">
                Onboarding link
              </p>
              <a
                href={status.onboardingUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sm text-primary underline"
              >
                {status.onboardingUrl}
              </a>
            </div>
          ) : null}

          {status.recentPayouts.length > 0 ? (
            <div className="mt-2 grid gap-2">
              <p className="text-xs font-bold uppercase text-on-surface-variant">
                Recent payouts
              </p>
              {status.recentPayouts.map((payout) => (
                <div
                  key={payout.stripePayoutId}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="font-semibold">{formatCents(payout.amountCents)}</span>
                  <span className="text-on-surface-variant">{payout.payoutStatus}</span>
                  <span className="text-on-surface-variant">
                    {formatAdminDate(payout.occurredAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <ActionButton
        label={status ? 'Refresh Stripe status' : 'Check Stripe status'}
        busyLabel="Checking"
        isBusy={loading}
        disabled={loading}
        onClick={loadStatus}
      />
    </Panel>
  );
}

function DonationsPanel({ donations }: { donations: AdminDonationItem[] }) {
  return (
    <Panel>
      <h2 className="text-lg font-bold">Donations made</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-outline-variant">
            <tr>
              <AdminHeaderCell>Campaign</AdminHeaderCell>
              <AdminHeaderCell>Athlete</AdminHeaderCell>
              <AdminHeaderCell>Amount</AdminHeaderCell>
              <AdminHeaderCell>Status</AdminHeaderCell>
              <AdminHeaderCell>Date</AdminHeaderCell>
            </tr>
          </thead>
          <tbody>
            {donations.length === 0 ? (
              <AdminEmptyRow colSpan={5} message="No donations from this user." />
            ) : (
              donations.map((donation) => (
                <tr key={donation.donationId} className="border-b border-outline-variant/60">
                  <td className="px-4 py-3 font-semibold">{donation.campaignTitle}</td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {donation.athleteFullName}
                  </td>
                  <td className="px-4 py-3">{formatCents(donation.donationAmountCents)}</td>
                  <td className="px-4 py-3">
                    <AdminStatusBadge
                      label={donation.donationStatus}
                      tone={donationStatusTone(donation.donationStatus)}
                    />
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {formatAdminDate(donation.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[8px] border border-outline-variant bg-surface-container-lowest p-5">
      {children}
    </div>
  );
}

function StatusRow({ label, badge }: { label: string; badge: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-on-surface-variant">{label}</span>
      {badge}
    </div>
  );
}

function ActionButton({
  label,
  busyLabel,
  isBusy,
  disabled,
  onClick,
}: {
  label: string;
  busyLabel: string;
  isBusy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-5 min-h-10 rounded-pill bg-secondary px-4 text-sm font-semibold text-on-secondary disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-on-surface-variant"
    >
      {isBusy ? busyLabel : label}
    </button>
  );
}

function SecondaryButton({
  label,
  isBusy,
  disabled,
  onClick,
}: {
  label: string;
  isBusy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-10 rounded-pill border border-outline-variant px-4 text-sm font-semibold transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:text-on-surface-variant"
    >
      {isBusy ? 'Working' : label}
    </button>
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

function isAdminUserDetail(value: unknown): value is AdminUserDetail {
  return typeof value === 'object' && value !== null && 'userId' in value;
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
