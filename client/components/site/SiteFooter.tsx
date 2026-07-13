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
    <footer className="border-t border-outline-variant bg-surface-container-low pb-24 pt-2 md:py-16 md:pb-16">
      <div className="mx-auto hidden w-full max-w-[var(--spacing-container-max)] gap-12 px-16 md:grid md:grid-cols-[1.4fr_repeat(3,1fr)]">
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
      <div className="mx-auto mt-4 flex w-full max-w-[var(--spacing-container-max)] flex-col items-center justify-between gap-1 px-5 pt-4 text-center text-xs text-on-surface-variant md:mt-12 md:flex-row md:items-center md:gap-3 md:border-t md:border-outline-variant/60 md:px-16 md:pt-6 md:text-left">
        <span>© {new Date().getFullYear()} ARC. All rights reserved.</span>
        <span className="flex items-center gap-3">
          <Link href="/privacy" className="transition-colors hover:text-primary">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-primary">
            Terms
          </Link>
        </span>
        <span>Built in Canada · Designed for athletes everywhere.</span>
      </div>
    </footer>
  );
}
