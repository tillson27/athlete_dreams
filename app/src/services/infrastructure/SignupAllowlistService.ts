import { singleton } from 'tsyringe';
import { SignupAllowlistRepository } from '../../repositories/SignupAllowlistRepository';

/**
 * Public API contract: invite gate entries are exact emails like `a@b.c` or
 * whole domains like `@b.c`, matched case-insensitively. Env entries and DB
 * entries are unioned; if both are empty, sign-up/sign-in is open.
 */
@singleton()
export class SignupAllowlistService {
  private cachedRawValue: string | undefined;
  private cachedEntries: string[] = [];

  constructor(private readonly signupAllowlistRepository: SignupAllowlistRepository) {}

  async isEnforced(): Promise<boolean> {
    if (this.getEnvEntries().length > 0) {
      return true;
    }
    return (await this.signupAllowlistRepository.findAll()).length > 0;
  }

  async isAllowed(email: string): Promise<boolean> {
    const dbEntries = await this.signupAllowlistRepository.findAll();
    const entries = [
      ...this.getEnvEntries(),
      ...dbEntries.map((entry) => normalizeAllowlistEntry(entry.entry)),
    ];
    if (entries.length === 0) {
      return true;
    }
    return entries.some((entry) => isAllowlistMatch(email, entry));
  }

  getEnvEntries(): string[] {
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

export function normalizeAllowlistEntry(entry: string): string {
  return entry.trim().toLowerCase();
}

export function isAllowlistMatch(email: string, entry: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const emailDomain = normalizedEmail.slice(normalizedEmail.indexOf('@'));
  return entry.startsWith('@') ? entry === emailDomain : entry === normalizedEmail;
}
