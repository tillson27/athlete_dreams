import { PostHog, setupExpressRequestContext } from 'posthog-node';
import { singleton } from 'tsyringe';
import type { Express } from 'express';

const POSTHOG_API_KEY_VAR = 'POSTHOG_API_KEY';
const POSTHOG_HOST_VAR = 'POSTHOG_HOST';

/**
 * Singleton PostHog client for server-side analytics.
 * Guards all calls behind an optional client — the app boots and runs normally
 * even when PostHog is not configured, but logs a clear error in non-production
 * environments so the missing configuration doesn't go unnoticed.
 */
@singleton()
export class PostHogService {
  private readonly client: PostHog | null;

  constructor() {
    const apiKey = process.env[POSTHOG_API_KEY_VAR];

    if (!apiKey) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          `${POSTHOG_API_KEY_VAR} variable required by PostHog is missing or un-configured, ` +
            'this causes events to be silently missed. ' +
            `This error stops appearing once ${POSTHOG_API_KEY_VAR} is configured`
        );
      }
      this.client = null;
      return;
    }

    this.client = new PostHog(apiKey, {
      host: process.env[POSTHOG_HOST_VAR] ?? 'https://us.i.posthog.com',
      enableExceptionAutocapture: true,
    });
  }

  /**
   * Registers the PostHog Express request-context middleware so that
   * X-POSTHOG-DISTINCT-ID and X-POSTHOG-SESSION-ID headers from the client
   * are automatically propagated to server-side events.
   * Call this before registering routes.
   */
  setupExpressContext(app: Express): void {
    if (this.client) {
      setupExpressRequestContext(this.client, app);
    }
  }

  capture(params: {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  }): void {
    this.client?.capture(params);
  }

  identify(params: {
    distinctId: string;
    properties?: Record<string, unknown>;
  }): void {
    this.client?.identify(params);
  }

  captureException(err: unknown, distinctId?: string): void {
    this.client?.captureException(err, distinctId);
  }

  async flush(): Promise<void> {
    if (this.client) {
      await this.client.flush();
    }
  }

  async shutdown(): Promise<void> {
    if (this.client) {
      await this.client.shutdown();
    }
  }
}
