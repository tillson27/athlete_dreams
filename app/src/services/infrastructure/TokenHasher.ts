import { createHash } from 'node:crypto';
import { singleton } from 'tsyringe';

@singleton()
export class TokenHasher {
  hashToken(plaintextToken: string): string {
    return createHash('sha256').update(plaintextToken).digest('hex');
  }
}
