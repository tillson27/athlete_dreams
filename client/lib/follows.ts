'use client';

import { useCallback, useEffect, useState } from 'react';
import { createBrowserStore } from './browserStore';
import { DATA_SOURCE } from './dataSource';
import { useSession } from './session';
import { fetchMyFollows, followAthlete, unfollowAthlete } from './api';

/**
 * The follow graph behind one exported hook shape, with two implementations
 * selected by `DATA_SOURCE`:
 * - **mock** (default, GitHub Pages / static export): a frontend-only set of followed
 *   athlete slugs in `arc-follows` localStorage, shared across profiles, the directory,
 *   and the community feed. Behaviour is unchanged from the prototype.
 * - **api**: the real follow graph. A signed-in caller loads from `GET /v1/users/me/follows`
 *   and each toggle POSTs/DELETEs the athlete's `follow`, adopting the full list the
 *   endpoint returns (single round-trip sync). An anonymous caller never writes locally —
 *   `requiresSignIn` tells consumers to route to `/sign-in` instead.
 *
 * Public API contract: consumers only ever see the `FollowsState` shape below; both modes
 * honour it identically. `requiresSignIn` is only ever true in api mode with no session;
 * `error` (a one-sentence message) is only ever set by a failed api-mode toggle.
 */
export type FollowsState = {
  follows: string[];
  ready: boolean;
  isFollowing: (slug: string) => boolean;
  toggle: (slug: string) => void;
  requiresSignIn: boolean;
  error: string | null;
};

const store = createBrowserStore<string[]>('arc-follows', 'arc-follows-change');

export function toggleFollow(slug: string) {
  const list = store.read() ?? [];
  store.write(list.includes(slug) ? list.filter((entry) => entry !== slug) : [...list, slug]);
}

const FOLLOW_ERROR_MESSAGE = "Couldn't update that follow. Please try again.";

type ApiFollowSnapshot = {
  follows: string[];
  ready: boolean;
  error: string | null;
};

let apiFollowSnapshot: ApiFollowSnapshot = { follows: [], ready: false, error: null };
let apiLoadedForEmail: string | null = null;
let apiLoadingForEmail: string | null = null;
let apiRequestSeq = 0;
const apiListeners = new Set<(snapshot: ApiFollowSnapshot) => void>();

function setApiFollowSnapshot(next: ApiFollowSnapshot): void {
  apiFollowSnapshot = next;
  for (const listener of apiListeners) {
    listener(apiFollowSnapshot);
  }
}

function subscribeApiFollows(listener: (snapshot: ApiFollowSnapshot) => void): () => void {
  apiListeners.add(listener);
  listener(apiFollowSnapshot);
  return () => {
    apiListeners.delete(listener);
  };
}

// SSR-safe: `ready` is false until mounted (and, in api mode, until the initial
// follow list resolves) so buttons render a stable default.
export function useFollows(): FollowsState {
  const isApi = DATA_SOURCE === 'api';
  const { session, ready: sessionReady } = useSession();
  const signedIn = isApi && Boolean(session);

  const [follows, setFollows] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isApi) {
      const sync = () => setFollows(store.read() ?? []);
      sync();
      setReady(true);
      return store.subscribe(sync);
    }

    return subscribeApiFollows((snapshot) => {
      setFollows(snapshot.follows);
      setReady(snapshot.ready);
      setError(snapshot.error);
    });
  }, [isApi]);

  useEffect(() => {
    if (!isApi) return;
    if (!sessionReady) return;

    if (!signedIn) {
      apiLoadedForEmail = null;
      apiLoadingForEmail = null;
      setApiFollowSnapshot({ follows: [], ready: true, error: null });
      return;
    }

    const email = session?.email ?? '';
    if (!email || apiLoadedForEmail === email || apiLoadingForEmail === email) return;

    let active = true;
    apiLoadingForEmail = email;
    setApiFollowSnapshot({ ...apiFollowSnapshot, ready: false, error: null });
    fetchMyFollows()
      .then((response) => {
        if (!active) return;
        apiLoadedForEmail = email;
        setApiFollowSnapshot({
          follows: response.items.map((follow) => follow.athleteSlug),
          ready: true,
          error: null,
        });
      })
      .catch(() => {
        // A 401 self-clears the session via the api layer's unauthorized handler,
        // which re-runs this effect signed-out; other failures leave an empty list.
        if (!active) return;
        setApiFollowSnapshot({ follows: [], ready: true, error: null });
      })
      .finally(() => {
        if (apiLoadingForEmail === email) apiLoadingForEmail = null;
      });

    return () => {
      active = false;
    };
  }, [isApi, signedIn, session?.email, sessionReady]);

  const toggle = useCallback(
    (slug: string) => {
      if (!isApi) {
        toggleFollow(slug);
        return;
      }
      if (!signedIn) return;

      const seq = apiRequestSeq + 1;
      apiRequestSeq = seq;

      const previous = apiFollowSnapshot.follows;
      const wasFollowing = previous.includes(slug);
      setApiFollowSnapshot({
        follows: wasFollowing ? previous.filter((entry) => entry !== slug) : [...previous, slug],
        ready: true,
        error: null,
      });

      const request = wasFollowing ? unfollowAthlete(slug) : followAthlete(slug);
      request
        .then((response) => {
          if (apiRequestSeq === seq) {
            setApiFollowSnapshot({
              follows: response.items.map((follow) => follow.athleteSlug),
              ready: true,
              error: null,
            });
          }
        })
        .catch(() => {
          if (apiRequestSeq === seq) {
            setApiFollowSnapshot({ follows: previous, ready: true, error: FOLLOW_ERROR_MESSAGE });
          }
        });
    },
    [isApi, signedIn]
  );

  return {
    follows,
    ready,
    isFollowing: (slug: string) => follows.includes(slug),
    toggle,
    requiresSignIn: isApi && sessionReady && !signedIn,
    error,
  };
}
