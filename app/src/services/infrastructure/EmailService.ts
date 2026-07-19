import { singleton } from 'tsyringe';
import { Logger } from './Logger';
import {
  passwordResetEmail,
  verificationEmail,
  welcomeEmail,
  type EmailContent,
} from '../email/templates';

type VerificationEmailInput = {
  to: string;
  displayName: string;
  verifyUrl: string;
};

type WelcomeEmailInput = {
  to: string;
  displayName: string;
  profileUrl: string;
};

type PasswordResetEmailInput = {
  to: string;
  displayName: string;
  resetUrl: string;
  expiresInMinutes: number;
};

type ResendSuccessResponse = {
  id: string;
};

type EmailKind = 'verification' | 'welcome' | 'password_reset';

const RESEND_SEND_EMAIL_URL = 'https://api.resend.com/emails';
const RETRY_DELAY_MS = 500;

@singleton()
export class EmailService {
  constructor(private readonly logger: Logger) {}

  sendVerification(input: VerificationEmailInput): Promise<string> {
    return this.send(input.to, verificationEmail(input), 'verification');
  }

  sendWelcome(input: WelcomeEmailInput): Promise<string> {
    return this.send(input.to, welcomeEmail(input), 'welcome');
  }

  sendPasswordReset(input: PasswordResetEmailInput): Promise<string> {
    return this.send(input.to, passwordResetEmail(input), 'password_reset');
  }

  private async send(to: string, content: EmailContent, emailKind: EmailKind): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        return await this.sendOnce(to, content, emailKind);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown Resend failure');
        if (attempt < 2) {
          await delay(RETRY_DELAY_MS);
        }
      }
    }

    throw lastError ?? new Error('Resend failed');
  }

  private async sendOnce(to: string, content: EmailContent, emailKind: EmailKind): Promise<string> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is required to send email.');
    }

    const response = await fetch(RESEND_SEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
    });

    if (!response.ok) {
      this.logger.warn({ status: response.status, emailKind }, 'resend.email_send_failed');
      throw new Error(`Resend failed with status ${response.status}`);
    }

    const body = await response.json();
    if (!isResendSuccessResponse(body)) {
      this.logger.warn({ emailKind }, 'resend.email_send_malformed_response');
      throw new Error('Resend returned an unexpected response.');
    }

    this.logger.info({ resendEmailId: body.id, emailKind }, 'resend.email_sent');
    return body.id;
  }
}

function isResendSuccessResponse(value: unknown): value is ResendSuccessResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as { id: unknown }).id === 'string'
  );
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
