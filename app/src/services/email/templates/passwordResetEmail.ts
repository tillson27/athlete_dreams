import type { EmailContent } from './types';
import { actionButton, linkFallback, paragraph, renderEmailShell } from './shared';

type PasswordResetEmailInput = {
  displayName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export function passwordResetEmail({
  displayName,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailInput): EmailContent {
  const bodyHtml = [
    paragraph(`Hi ${displayName},`),
    paragraph(`Use this link to reset your ARC password. It expires in ${expiresInMinutes} minutes.`),
    actionButton('Reset password', resetUrl),
    paragraph('If you did not ask for this, you can ignore this email. Your current password will stay the same.'),
    linkFallback(resetUrl),
  ].join('');

  return {
    subject: 'Reset your ARC password',
    html: renderEmailShell({
      preview: 'Reset your ARC password.',
      title: 'Reset your password',
      bodyHtml,
    }),
    text: `Hi ${displayName},

Use this link to reset your ARC password. It expires in ${expiresInMinutes} minutes.

Reset password: ${resetUrl}

If you did not ask for this, you can ignore this email. Your current password will stay the same.`,
  };
}
