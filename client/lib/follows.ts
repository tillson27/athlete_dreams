'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

// SSR-safe: `ready` is false until mounted (and, in api mode, until the initial
// follow list resolves) so buttons render a stable default.
export function useFollows(): FollowsState {
  const isApi = DATA_SOURCE === 'api';
  const { session, ready: sessionReady } = useSession();
  const signedIn = isApi && Boolean(session);

  const [follows, setFollows] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards a toggle's optimistic update so a slower concurrent request can't
  // overwrite a newer list once its own round-trip resolves.
  const requestSeq = useRef(0);

  useEffect(() => {
    if (!isApi) {
      const sync = () => setFollows(store.read() ?? []);
      sync();
      setReady(true);
      return store.subscribe(sync);
    }

    if (!sessionReady) return;

    if (!signedIn) {
      setFollows([]);
      setError(null);
      setReady(true);
      return;
    }

    let active = true;
    setReady(false);
    fetchMyFollows()
      .then((response) => {
        if (!active) return;
        setFollows(response.items.map((follow) => follow.athleteSlug));
        setReady(true);
      })
      .catch(() => {
        // A 401 self-clears the session via the api layer's unauthorized handler,
        // which re-runs this effect signed-out; other failures leave an empty list.
        if (!active) return;
        setFollows([]);
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [isApi, signedIn, sessionReady]);

  const toggle = useCallback(
    (slug: string) => {
      if (!isApi) {
        toggleFollow(slug);
        return;
      }
      if (!signedIn) return;

      setError(null);
      const seq = requestSeq.current + 1;
      requestSeq.current = seq;

      const previous = follows;
      const wasFollowing = previous.includes(slug);
      setFollows(
        wasFollowing ? previous.filter((entry) => entry !== slug) : [...previous, slug]
      );

      const request = wasFollowing ? unfollowAthlete(slug) : followAthlete(slug);
      request
        .then((response) => {
          if (requestSeq.current === seq) {
            setFollows(response.items.map((follow) => follow.athleteSlug));
          }
        })
        .catch(() => {
          if (requestSeq.current === seq) {
            setFollows(previous);
            setError(FOLLOW_ERROR_MESSAGE);
          }
        });
    },
    [isApi, signedIn, follows]
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
