import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmailService } from './EmailService';
import { Logger } from './Logger';

type ResendRequestBody = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
};

const originalResendApiKey = process.env.RESEND_API_KEY;
const originalResendFromEmail = process.env.RESEND_FROM_EMAIL;

function restoreEnv(key: 'RESEND_API_KEY' | 'RESEND_FROM_EMAIL', value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

describe('EmailService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    restoreEnv('RESEND_API_KEY', originalResendApiKey);
    restoreEnv('RESEND_FROM_EMAIL', originalResendFromEmail);
  });

  it('sends Resend payloads with bearer auth and provider-shaped response parsing', async () => {
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.RESEND_FROM_EMAIL = 'ARC <noreply@example.test>';

    const fetchMock = vi.fn(async (_input: string | URL | Request, _init?: RequestInit) => {
      return new Response(JSON.stringify({ id: '49a3999c-0ce1-4ea6-ab68-afcd6dc2e794' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const logger = new Logger();
    vi.spyOn(logger, 'info').mockImplementation(() => undefined);
    vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
    const service = new EmailService(logger);

    const resendEmailId = await service.sendVerification({
      to: 'athlete@example.test',
      displayName: 'Maya',
      verifyUrl: 'https://arc.example.test/verify-email?token=test-token',
    });

    expect(resendEmailId).toBe('49a3999c-0ce1-4ea6-ab68-afcd6dc2e794');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const firstCall = fetchMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) {
      throw new Error('Expected Resend fetch to be called.');
    }

    const [url, init] = firstCall;
    expect(url).toBe('https://api.resend.com/emails');
    expect(init).toBeDefined();
    if (!init) {
      throw new Error('Expected Resend fetch options.');
    }

    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      Authorization: 'Bearer test-resend-key',
      'Content-Type': 'application/json',
    });

    expect(typeof init.body).toBe('string');
    const body = JSON.parse(init.body as string) as ResendRequestBody;
    expect(body.from).toBe('ARC <noreply@example.test>');
    expect(body.to).toEqual(['athlete@example.test']);
    expect(body.subject).toBe('Verify your ARC email');
    expect(body.html).toContain('https://arc.example.test/verify-email?token=test-token');
    expect(body.text).toContain('https://arc.example.test/verify-email?token=test-token');
  });
});
