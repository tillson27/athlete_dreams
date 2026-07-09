// Canonical input styling constants. Import these instead of re-declaring
// input class strings so focus/border/surface treatments stay in sync.

// Register-flow step forms.
export const formInputClass =
  'w-full rounded-input border border-outline-variant bg-surface p-3 text-base outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary';

// Auth forms (sign-in / sign-up).
export const authInputClass =
  'w-full rounded-input border border-outline-variant bg-surface-container-low px-4 py-3 text-base text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:border-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/25';
