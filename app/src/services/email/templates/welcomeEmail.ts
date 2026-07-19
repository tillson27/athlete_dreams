import type { EmailContent } from './types';
import { actionButton, linkFallback, paragraph, renderEmailShell } from './shared';

type WelcomeEmailInput = {
  displayName: string;
  profileUrl: string;
};

export function welcomeEmail({ displayName, profileUrl }: WelcomeEmailInput): EmailContent {
  const bodyHtml = [
    paragraph(`Welcome to ARC, ${displayName}.`),
    paragraph('Your account is ready. Start shaping the story supporters and teams will see when they visit your profile.'),
    actionButton('View your profile', profileUrl),
    linkFallback(profileUrl),
  ].join('');

  return {
    subject: 'Welcome to ARC',
    html: renderEmailShell({
      preview: 'Your ARC account is ready.',
      title: 'Your story has a home',
      bodyHtml,
    }),
    text: `Welcome to ARC, ${displayName}.

Your account is ready. Start shaping the story supporters and teams will see when they visit your profile.

View your profile: ${profileUrl}`,
  };
}
