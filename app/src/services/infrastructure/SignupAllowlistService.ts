import { singleton } from 'tsyringe';

/**
 * Invite gate over auth entry points, driven by SIGNUP_EMAIL_ALLOWLIST
 * (comma-separated; entries are exact emails like `a@b.c` or whole domains
 * like `@b.c`, matched case-insensitively). Unset/empty = open (no gate).
 * The env var is re-read per call so tests and config reloads take effect
 * without rebuilding the DI container.
 */
@singleton()
export class SignupAllowlistService {
  private cachedRawValue: string | undefined;
  private cachedEntries: string[] = [];

  isEnforced(): boolean {
    return this.parseEntries().length > 0;
  }

  isAllowed(email: string): boolean {
    const entries = this.parseEntries();
    if (entries.length === 0) {
      return true;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const emailDomain = normalizedEmail.slice(normalizedEmail.indexOf('@'));
    return entries.some((entry) =>
      entry.startsWith('@') ? entry === emailDomain : entry === normalizedEmail
    );
  }

  private parseEntries(): string[] {
    const rawValue = process.env.SIGNUP_EMAIL_ALLOWLIST ?? '';
    if (rawValue !== this.cachedRawValue) {
      this.cachedRawValue = rawValue;
      this.cachedEntries = rawValue
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
    }
    return this.cachedEntries;
  }
}
