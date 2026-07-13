'use client';

import { useEffect, useState } from 'react';
import { createBrowserStore } from './browserStore';

const cheersStore = createBrowserStore<Record<string, boolean>>('arc-cheers', 'arc-cheers-change');

export function usePrototypeCheers(): {
  cheered: Record<string, boolean>;
  toggleCheer: (feedItemId: string) => void;
} {
  const [cheered, setCheered] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const sync = () => setCheered(cheersStore.read() ?? {});
    sync();
    return cheersStore.subscribe(sync);
  }, []);

  return {
    cheered,
    toggleCheer: (feedItemId) =>
      setCheered((currentCheered) => {
        const nextCheered = { ...currentCheered, [feedItemId]: !currentCheered[feedItemId] };
        cheersStore.write(nextCheered);
        return nextCheered;
      }),
  };
}
