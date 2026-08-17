'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  AdminAnalyticsResponse,
  AdminDailyStat,
  AdminDonationDailyStat,
} from 'fad-common';
import { fetchAdminAnalytics } from '@/lib/api';
import { formatCents } from '@/lib/format';

export default function AdminOverviewPage() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchAdminAnalytics()
      .then((response) => {
        if (mounted) {
          setAnalytics(response);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Analytics could not load.');
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <section className="grid gap-4">
        <PageTitle title="Overview" subtitle="Analytics" />
        <div className="rounded-[8px] border border-error/30 bg-surface-container-lowest p-5 text-error">
          {error}
        </div>
      </section>
    );
  }

  if (!analytics) {
    return <OverviewLoading />;
  }

  return (
    <section className="grid gap-6">
      <PageTitle title="Overview" subtitle="Analytics" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Users" value={analytics.totalUsers} accent="bg-focus" />
        <MetricCard
          label="Published Athletes"
          value={analytics.publishedAthletes}
          accent="bg-success"
        />
        <MetricCard
          label="Active Campaigns"
          value={analytics.activeCampaigns}
          accent="bg-primary"
        />
        <MetricCard
          label="Total Raised"
          value={formatCents(analytics.totalRaisedCents, 'CAD')}
          accent="bg-secondary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendPanel
          title="Signups"
          summary={`${analytics.signupsLast30Days} in 30 days`}
          days={analytics.userSignupsByDay}
          valueKey="count"
          tone="bg-focus"
        />
        <TrendPanel
          title="Donations"
          summary={`${analytics.totalSucceededDonations} succeeded`}
          days={analytics.donationsByDay}
          valueKey="amountCents"
          formatValue={(value) => formatCents(value, 'CAD')}
          tone="bg-primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-[8px] border border-outline-variant bg-surface-container-lowest p-5">
          <p className="text-sm font-semibold text-on-surface-variant">Last 30 days</p>
          <dl className="mt-4 grid gap-3">
            <InlineStat label="New users" value={analytics.signupsLast30Days} />
            <InlineStat label="New athlete profiles" value={analytics.athletesLast30Days} />
            <InlineStat label="Published athletes" value={analytics.publishedAthletes} />
          </dl>
        </div>
        <FunnelPanel analytics={analytics} />
      </div>
    </section>
  );
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase text-on-surface-variant">
        {subtitle}
      </p>
      <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">{title}</h1>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="rounded-[8px] border border-outline-variant bg-surface-container-lowest p-5">
      <div className={`h-1.5 w-12 rounded-pill ${accent}`} />
      <p className="mt-4 text-sm font-semibold text-on-surface-variant">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function TrendPanel<TDay extends AdminDailyStat | AdminDonationDailyStat>({
  title,
  summary,
  days,
  valueKey,
  formatValue = String,
  tone,
}: {
  title: string;
  summary: string;
  days: TDay[];
  valueKey: keyof TDay;
  formatValue?: (value: number) => string;
  tone: string;
}) {
  const values = useMemo<number[]>(
    () =>
      days.map((day) => {
        const value = day[valueKey];
        return typeof value === 'number' ? value : 0;
      }),
    [days, valueKey]
  );
  const maxValue = Math.max(...values, 1);
  const totalValue = values.reduce((sum, value) => sum + value, 0);

  return (
    <div className="rounded-[8px] border border-outline-variant bg-surface-container-lowest p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{summary}</p>
        </div>
        <p className="text-sm font-semibold">{formatValue(totalValue)}</p>
      </div>
      <div className="mt-6 flex h-28 items-end gap-1 border-b border-outline-variant/70 pb-1">
        {days.length === 0 ? (
          <div className="grid h-full w-full place-items-center text-sm text-on-surface-variant">
            No activity
          </div>
        ) : (
          days.map((day, index) => {
            const value = values[index] ?? 0;
            return (
              <div key={day.date} className="flex min-w-0 flex-1 items-end">
                <div
                  title={`${day.date}: ${formatValue(value)}`}
                  className={`w-full rounded-t-[3px] ${tone}`}
                  style={{
                    height: `${Math.max((value / maxValue) * 100, value > 0 ? 6 : 0)}%`,
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function FunnelPanel({ analytics }: { analytics: AdminAnalyticsResponse }) {
  const steps = [
    { label: 'Total Users', value: analytics.totalUsers, denominator: analytics.totalUsers },
    {
      label: 'Has Athlete Profile',
      value: analytics.totalAthletes,
      denominator: analytics.totalUsers,
    },
    {
      label: 'Published',
      value: analytics.publishedAthletes,
      denominator: analytics.totalAthletes,
    },
  ];

  return (
    <div className="rounded-[8px] border border-outline-variant bg-surface-container-lowest p-5">
      <h2 className="text-lg font-bold">Conversion Funnel</h2>
      <div className="mt-5 grid gap-3">
        {steps.map((step) => {
          const percent = percentage(step.value, step.denominator);
          return (
            <div key={step.label} className="grid gap-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-semibold">{step.label}</span>
                <span className="text-on-surface-variant">
                  {step.value} · {percent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-pill bg-surface-container">
                <div
                  className="h-full rounded-pill bg-success"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InlineStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-on-surface-variant">{label}</dt>
      <dd className="text-sm font-bold">{value}</dd>
    </div>
  );
}

function OverviewLoading() {
  return (
    <section className="grid gap-6">
      <div>
        <div className="h-4 w-24 animate-pulse rounded-pill bg-surface-container" />
        <div className="mt-2 h-9 w-40 animate-pulse rounded-pill bg-surface-container" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-[8px] bg-surface-container"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-52 animate-pulse rounded-[8px] bg-surface-container" />
        <div className="h-52 animate-pulse rounded-[8px] bg-surface-container" />
      </div>
    </section>
  );
}

function percentage(value: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return Math.min(Math.round((value / denominator) * 100), 100);
}
