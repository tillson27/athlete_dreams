import Link from 'next/link';
import { Logo } from './Logo';
import { HeaderAuth } from './HeaderAuth';
import { MobileMenu } from './MobileMenu';

const nav: Array<{ href: string; label: string }> = [
  { href: '/athletes', label: 'Discover' },
  { href: '/community', label: 'Community' },
  { href: '/for-athletes', label: 'For Athletes' },
  { href: '/mission', label: 'Mission' },
  { href: '/how-it-works', label: 'How It Works' },
];

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-outline-variant/60 bg-surface/90 backdrop-blur"
    >
      <div className="mx-auto flex h-16 w-full max-w-[var(--spacing-container-max)] items-center justify-between gap-3 px-5 md:px-16">
        <div className="flex items-center gap-3">
          <Logo size="md" variant="full" />
        </div>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 md:flex"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label-bold text-on-surface transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <HeaderAuth />

          <MobileMenu nav={nav} />
        </div>
      </div>
    </header>
  );
}
