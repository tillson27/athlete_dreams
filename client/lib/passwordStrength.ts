import { strongPasswordSchema } from 'fad-common';

export type PasswordRequirement = {
  label: string;
  met: boolean;
};

export function passwordRequirements(password: string): PasswordRequirement[] {
  return [
    { label: '10+ characters', met: password.length >= 10 },
    { label: 'Letter', met: /[A-Za-z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
  ];
}

export function passwordIsStrong(password: string): boolean {
  return strongPasswordSchema.safeParse(password).success;
}
