import Link from 'next/link';
import { Logo } from './Logo';
import { ArrowGlyph, LinkButton } from '../ui/Button';

const nav = [
  { href: '/athletes', label: 'Athletes' },
  { href: '/brands', label: 'For Brands' },
  { href: '/ambassadors', label: 'Ambassador Programs' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo size="md" />

        <nav
          aria-label="Primary"
          className="hidden items-center gap-7 text-sm font-medium text-ink/80 md:flex"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-flame transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/sign-in"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-ink/5 md:inline-flex"
          >
            Sign in
          </Link>
          <LinkButton href="/sign-up" tone="flame" size="sm" className="group">
            <span>Start a profile</span>
            <ArrowGlyph className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </LinkButton>

          <details data-mobile-menu className="relative md:hidden">
            <summary
              aria-label="Open menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-ink/5"
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
            <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-xl">
              <ul className="divide-y divide-ink/5 py-2">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block px-5 py-3 text-base font-medium text-ink hover:bg-ink/5"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/sign-in"
                    className="block px-5 py-3 text-base font-medium text-ink hover:bg-ink/5"
                  >
                    Sign in
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
