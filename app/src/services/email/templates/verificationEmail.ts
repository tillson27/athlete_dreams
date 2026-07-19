import type { EmailContent } from './types';
import { actionButton, linkFallback, paragraph, renderEmailShell } from './shared';

type VerificationEmailInput = {
  displayName: string;
  verifyUrl: string;
};

export function verificationEmail({ displayName, verifyUrl }: VerificationEmailInput): EmailContent {
  const bodyHtml = [
    paragraph(`Hi ${displayName},`),
    paragraph('Confirm your email address so we can keep your ARC account secure and ready for athlete updates.'),
    actionButton('Verify email', verifyUrl),
    linkFallback(verifyUrl),
  ].join('');

  return {
    subject: 'Verify your ARC email',
    html: renderEmailShell({
      preview: 'Confirm your email address for ARC.',
      title: 'Verify your email',
      bodyHtml,
    }),
    text: `Hi ${displayName},

Confirm your email address so we can keep your ARC account secure and ready for athlete updates.

Verify email: ${verifyUrl}`,
  };
}
