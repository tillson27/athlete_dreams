// TODO: Remove this prototype storage adapter when backend state replaces browser persistence.
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
        /* localStorage can be disabled; prototype state should not break the page */
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
