import { ValidationError } from './errors';

// Opaque keyset cursor for stable `(createdAt desc, id desc)` pagination.
// Encodes the last row's sort key as base64url of `createdAt|id`; callers never
// interpret the payload. Decoding rejects malformed input with a ValidationError
// so a garbage cursor surfaces as 422 rather than a 500.
export interface KeysetCursor {
  createdAt: Date;
  id: string;
}

export function encodeKeysetCursor(cursor: KeysetCursor): string {
  const payload = `${cursor.createdAt.toISOString()}|${cursor.id}`;
  return Buffer.from(payload, 'utf8').toString('base64url');
}

export function decodeKeysetCursor(encoded: string): KeysetCursor {
  const payload = Buffer.from(encoded, 'base64url').toString('utf8');
  const separatorIndex = payload.indexOf('|');
  if (separatorIndex === -1) {
    throw new ValidationError('Invalid pagination cursor');
  }
  const createdAtIso = payload.slice(0, separatorIndex);
  const id = payload.slice(separatorIndex + 1);
  const createdAt = new Date(createdAtIso);
  if (!id || Number.isNaN(createdAt.getTime())) {
    throw new ValidationError('Invalid pagination cursor');
  }
  return { createdAt, id };
}
