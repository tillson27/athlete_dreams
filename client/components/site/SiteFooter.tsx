import Link from 'next/link';
import { Logo } from './Logo';

const columns = [
  {
    title: 'Athletes',
    links: [
      { href: '/sign-up', label: 'Create a profile' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/athletes', label: 'Discover athletes' },
    ],
  },
  {
    title: 'Brands',
    links: [
      { href: '/brands', label: 'Sponsor an athlete' },
      { href: '/ambassadors', label: 'Managed ambassador programs' },
      { href: '/about', label: 'Our values' },
    ],
  },
  {
    title: 'Network',
    links: [
      { href: '/about', label: 'About FAD' },
      { href: '/about#contact', label: 'Contact us' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink/5 bg-paper-soft py-16 text-ink">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo size="lg" full />
          <p className="max-w-md text-sm text-ink/65">
            The most transparent athlete funding network. We help athletes raise what they need, brands meet the people behind the stats, and enterprises run ambassador programs that actually work.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">{column.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink/80">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-flame transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex w-full max-w-7xl flex-col items-start justify-between gap-4 border-t border-ink/10 px-6 pt-6 text-xs text-ink/55 md:flex-row md:items-center">
        <span>© {new Date().getFullYear()} FAD Network. All rights reserved.</span>
        <span>Built in Canada · Designed for athletes everywhere.</span>
      </div>
    </footer>
  );
}
