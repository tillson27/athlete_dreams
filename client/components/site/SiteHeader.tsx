import Link from 'next/link';
import { Logo } from './Logo';
import { LinkButton } from '../ui/Button';

const nav: Array<{ href: string; label: string }> = [
  { href: '/athletes', label: 'Discover' },
  { href: '/brands', label: 'Brand Hub' },
  { href: '/ambassadors', label: 'Ambassadors' },
  { href: '/how-it-works', label: 'How It Works' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-outline-variant/60 bg-surface/90 backdrop-blur">
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
          <Link
            href="/sign-in"
            className="hidden label-bold rounded-pill px-3 py-2 text-on-surface-variant hover:text-primary md:inline-flex"
          >
            Sign In
          </Link>
          <LinkButton href="/sign-up" tone="primary" size="sm">
            Donate
          </LinkButton>

          <details data-mobile-menu className="relative md:hidden">
            <summary
              aria-label="Open menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-pill text-on-surface hover:bg-surface-container"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="menu-icon-open h-5 w-5"
                aria-hidden="true"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="menu-icon-close h-5 w-5"
                aria-hidden="true"
              >
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </summary>
            <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest shadow-xl">
              <ul className="divide-y divide-outline-variant/60 py-2">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block px-5 py-3 text-base font-semibold text-on-surface hover:bg-surface-container"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/sign-in"
                    className="block px-5 py-3 text-base font-semibold text-on-surface hover:bg-surface-container"
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
