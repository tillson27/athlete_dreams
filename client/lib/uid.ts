// Single id generator for client-side entities (form rows, saved edits).
// crypto.randomUUID is available in every supported browser and Node 19+.
export function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);
}
