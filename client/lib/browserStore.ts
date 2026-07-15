// Tiny localStorage-backed store shared by the mock persistence layers
// (session, follows, athlete edits, onboarding). Server-safe: every method
// no-ops (or returns null) when window/storage is unavailable, and change
// notification uses a same-tab custom event plus the cross-tab storage event.
export type BrowserStore<T> = {
  read: () => T | null;
  write: (value: T | null) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createBrowserStore<T>(storageKey: string, changeEventName: string): BrowserStore<T> {
  return {
    read: () => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    },
    write: (value) => {
      try {
        if (value === null) {
          window.localStorage.removeItem(storageKey);
        } else {
          window.localStorage.setItem(storageKey, JSON.stringify(value));
        }
        window.dispatchEvent(new Event(changeEventName));
      } catch {
        /* storage unavailable — value simply won't persist */
      }
    },
    subscribe: (listener) => {
      window.addEventListener(changeEventName, listener);
      window.addEventListener('storage', listener);
      return () => {
        window.removeEventListener(changeEventName, listener);
        window.removeEventListener('storage', listener);
      };
    },
  };
}
