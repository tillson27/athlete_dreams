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
      <aside className="border-outline-variant bg-gray-950 text-white md:fixed md:inset-y-0 md:left-0 md:w-64 md:border-r">
        <div className="flex min-h-full flex-col gap-6 px-4 py-5">
          <Link href="/admin" className="flex items-center gap-3 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-card bg-white text-gray-950">
              <Icon name="shield-check" className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">Admin</span>
          </Link>

          <nav aria-label="Admin" className="grid gap-1">
            {adminNav.map((item) => {
              const active =
                item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-input px-3 py-2 text-sm font-semibold transition-colors ${
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

          <div className="mt-auto grid gap-3 border-t border-white/15 pt-4">
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
      <main className="min-h-dvh px-5 py-6 md:px-8 lg:px-10">{children}</main>
    </div>
  );
}
