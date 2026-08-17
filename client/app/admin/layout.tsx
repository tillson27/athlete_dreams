'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { signOut, useSession } from '@/lib/session';

const adminNav: Array<{ href: string; label: string; icon: IconName }> = [
  { href: '/admin', label: 'Overview', icon: 'bar-chart' },
  { href: '/admin/users', label: 'Users', icon: 'person' },
  { href: '/admin/athletes', label: 'Athletes', icon: 'run' },
  { href: '/admin/campaigns', label: 'Campaigns', icon: 'target' },
  { href: '/admin/donations', label: 'Donations', icon: 'heart' },
  { href: '/admin/allowlist', label: 'Allowlist', icon: 'shield-check' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, ready } = useSession();

  useEffect(() => {
    if (ready && !session?.isAdmin) {
      router.replace('/sign-in');
    }
  }, [ready, router, session?.isAdmin]);

  if (!ready || !session?.isAdmin) {
    return (
      <main className="min-h-dvh bg-surface-container-lowest px-5 py-8">
        <div className="mx-auto grid max-w-5xl gap-4">
          <div className="h-8 w-44 animate-pulse rounded-pill bg-surface-container" />
          <div className="h-96 animate-pulse rounded-card bg-surface-container" />
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-surface-container-lowest text-on-surface md:pl-64">
      {/* Phones get a compact bar with a horizontally scrolling nav; the full
          vertical rail only appears once there is a column to spare. */}
      <aside className="sticky top-0 z-30 border-outline-variant bg-gray-950 text-white md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-r">
        <div className="flex flex-col gap-3 px-4 py-3 md:min-h-full md:gap-6 md:py-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="flex items-center gap-2.5 md:px-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-card bg-white text-gray-950 md:h-9 md:w-9">
                <Icon name="shield-check" className="h-4 w-4 md:h-5 md:w-5" />
              </span>
              <span className="font-display text-base font-bold md:text-lg">Admin</span>
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="shrink-0 rounded-input px-2 py-1 text-xs font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white md:hidden"
            >
              Sign out
            </button>
          </div>

          <nav
            aria-label="Admin"
            className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0"
          >
            {adminNav.map((item) => {
              const active =
                item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-input px-3 py-2 text-sm font-semibold transition-colors md:gap-3 ${
                    active
                      ? 'bg-white text-gray-950'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto hidden gap-3 border-t border-white/15 pt-4 md:grid">
            <div className="min-w-0 px-2">
              <p className="truncate text-sm font-semibold">{session.name}</p>
              <p className="truncate text-xs text-gray-400">{session.email}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="rounded-input px-3 py-2 text-left text-sm font-semibold text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="min-h-dvh px-4 py-5 sm:px-5 md:px-8 md:py-6 lg:px-10">{children}</main>
    </div>
  );
}
