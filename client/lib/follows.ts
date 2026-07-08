'use client';

import { useEffect, useState } from 'react';
import { createBrowserStore } from './browserStore';

// Frontend-only follow graph. A single localStorage set of followed athlete
// slugs, shared across profiles, the directory, and the community feed so
// "Follow" finally means something. Replaced by a real backend later.

const store = createBrowserStore<string[]>('arc-follows', 'arc-follows-change');

export function toggleFollow(slug: string) {
  const list = store.read() ?? [];
  store.write(list.includes(slug) ? list.filter((entry) => entry !== slug) : [...list, slug]);
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
    const sync = () => setFollows(store.read() ?? []);
    sync();
    setReady(true);
    return store.subscribe(sync);
  }, []);

  return {
    follows,
    ready,
    isFollowing: (slug: string) => follows.includes(slug),
    toggle: toggleFollow,
  };
}
