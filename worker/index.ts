const API_PATH_PREFIX = '/v1/';

export default {
  async fetch(request, env): Promise<Response> {
    const requestUrl = new URL(request.url);

    if (!requestUrl.pathname.startsWith(API_PATH_PREFIX)) {
      return env.ASSETS.fetch(request);
    }

    const targetUrl = new URL(requestUrl.pathname + requestUrl.search, env.API_ORIGIN);

    // CONTRACT: the outbound Request is constructed from the inbound one so the
    // body streams through unread. The Stripe Connect webhook verifies its
    // signature against the raw bytes, so reading or re-serializing here
    // (`request.text()`, `request.json()`) silently breaks it in production.
    return fetch(new Request(targetUrl, request));
  },
} satisfies ExportedHandler<Env>;
