import Link from 'next/link';
import { LogoLockup } from '@/components/site/Logo';

const links = [
  { label: 'Support', href: '/support' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

export function RegFooter() {
  return (
    <footer className="mt-auto border-t border-outline-variant bg-surface-container-low">
      <div className="mx-auto flex w-full max-w-[var(--spacing-container-max)] flex-col items-center justify-between gap-6 px-5 py-8 md:flex-row md:px-16">
        <div className="flex flex-col gap-1">
          <LogoLockup size="sm" variant="full" />
          <p className="text-xs text-on-surface-variant">
            © {new Date().getFullYear()} ARC. A home for your athletic story.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-on-surface-variant transition-colors hover:text-secondary hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
