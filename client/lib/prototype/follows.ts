'use client';

import { useEffect, useState } from 'react';
import { createBrowserStore } from './browserStore';

// TODO: Replace this prototype follow graph with the backend follow API in Step 9.

const store = createBrowserStore<string[]>('arc-follows', 'arc-follows-change');

export function toggleFollow(slug: string) {
  const list = store.read() ?? [];
  store.write(list.includes(slug) ? list.filter((entry) => entry !== slug) : [...list, slug]);
}

// Public API contract: `ready` is false until mounted so buttons render a stable default.
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
