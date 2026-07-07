import Link from 'next/link';
import { Logo } from './Logo';

const columns = [
  {
    title: 'Explore',
    links: [
      { href: '/athletes', label: 'Discover Runners' },
      { href: '/community', label: 'Community' },
      { href: '/how-it-works', label: 'How It Works' },
    ],
  },
  {
    title: 'For Runners',
    links: [
      { href: '/for-athletes', label: 'Why ARC' },
      { href: '/sign-up', label: 'Start Your Profile' },
      { href: '/sign-in', label: 'Sign In' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/mission', label: 'Mission' },
      { href: '/about', label: 'About' },
      { href: '/about#contact', label: 'Contact' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="hidden border-t border-outline-variant bg-surface-container-low py-16 md:block">
      <div className="mx-auto grid w-full max-w-[var(--spacing-container-max)] gap-12 px-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo size="lg" variant="full" />
          <p className="max-w-md text-sm leading-relaxed text-on-surface-variant">
            A verified home for a runner&rsquo;s whole story — the results, the journey behind them,
            and the community that carries you forward.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="label-bold text-on-surface">{column.title}</h3>
            <ul className="mt-5 space-y-3 text-sm text-on-surface-variant">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex w-full max-w-[var(--spacing-container-max)] flex-col items-start justify-between gap-3 border-t border-outline-variant/60 px-16 pt-6 text-xs text-on-surface-variant md:flex-row md:items-center">
        <span>© {new Date().getFullYear()} ARC. All rights reserved.</span>
        <span>Built in Canada · Designed for athletes everywhere.</span>
      </div>
    </footer>
  );
}
