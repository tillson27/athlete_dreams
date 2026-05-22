import Link from 'next/link';

// Mobile-only bottom nav. Matches the wireframe's icon language using
// inline SVGs so we don't need the Material Symbols web font.

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3L12 3Z" />
    </svg>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m9 15 2-6 6-2-2 6-6 2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </svg>
  );
}

const items: Array<{
  href: string;
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
}> = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/athletes', label: 'Discover', icon: CompassIcon },
  { href: '/brands', label: 'Brand Hub', icon: BriefcaseIcon },
  { href: '/sign-in', label: 'Profile', icon: UserIcon },
];

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-outline-variant bg-surface-container-lowest px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] md:hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 rounded-pill px-3 py-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-semibold uppercase tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
