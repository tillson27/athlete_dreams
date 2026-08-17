'use client';

import { useEffect, useRef, useState } from 'react';

// Mobile in-page tab nav that hides while scrolling down and returns on
// scroll-up, so the profile isn't boxed in by persistent chrome.
export function ProfileTabNav({ tabs }: { tabs: { label: string; href: string }[] }) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY.current;
      if (y < 120) {
        setHidden(false);
      } else if (Math.abs(y - lastY.current) > 8) {
        setHidden(goingDown);
      }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`no-scrollbar sticky top-16 z-30 -mx-5 flex gap-1 overflow-x-auto border-b border-outline-variant bg-surface/95 px-5 py-2 backdrop-blur transition-transform duration-300 md:hidden ${
        hidden ? '-translate-y-full opacity-0' : ''
      }`}
    >
      {tabs.map((tab) => (
        <a
          key={tab.href}
          href={tab.href}
          className="flex min-h-11 shrink-0 items-center rounded-pill px-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container active:bg-surface-container"
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
