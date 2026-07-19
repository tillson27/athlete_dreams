'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { HeaderAuth } from './HeaderAuth';

// Mobile disclosure menu. Client so it can close itself when a link is tapped —
// the header persists across client-side navigation, so a bare <details> stays open.
export function MobileMenu({ nav }: { nav: { href: string; label: string }[] }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const close = () => menuRef.current?.removeAttribute('open');

  return (
    <details ref={menuRef} data-mobile-menu className="relative md:hidden">
      <summary
        aria-label="Open menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-on-surface hover:bg-surface-container"
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
        <ul className="divide-y divide-outline-variant/60 py-2" onClick={close}>
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
          <HeaderAuth variant="mobile" />
        </ul>
      </div>
    </details>
  );
}
