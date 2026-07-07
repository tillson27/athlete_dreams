'use client';

import { useEffect, useState } from 'react';

// Frontend-only follow graph. A single localStorage set of followed athlete
// slugs, shared across profiles, the directory, and the community feed so
// "Follow" finally means something. Replaced by a real backend later.

const KEY = 'arc-follows';
const EVENT = 'arc-follows-change';

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable — follows won't persist */
  }
}

export function toggleFollow(slug: string) {
  const list = read();
  write(list.includes(slug) ? list.filter((entry) => entry !== slug) : [...list, slug]);
}

// SSR-safe: `ready` is false until mounted so buttons render a stable default.
export function useFollows(): {
  follows: string[];
  ready: boolean;
  isFollowing: (slug: string) => boolean;
  toggle: (slug: string) => void;
} {
  const [follows, setFollows] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setFollows(read());
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return {
    follows,
    ready,
    isFollowing: (slug: string) => follows.includes(slug),
    toggle: toggleFollow,
  };
}
