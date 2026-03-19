// Pages Advanced Mode: proxy /api/* to gateway, serve static for everything else
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const COMPOSER_URL = env.COMPOSER_WORKER_URL;
    const GATEWAY_URL = env.GATEWAY_WORKER_URL;

    // Proxy /mcp/* to Composer Worker
    if (url.pathname.startsWith('/mcp/')) {
      if (!COMPOSER_URL) {
        return new Response('Service not configured: COMPOSER_WORKER_URL is missing', { status: 503 });
      }
      const composerUrl = new URL(
        url.pathname + url.search,
        COMPOSER_URL
      );
      const headers = new Headers(request.headers);
      headers.set('X-Forwarded-Host', url.host);
      return fetch(composerUrl.toString(), {
        method: request.method,
        headers,
        body: request.body,
      });
    }

    if (url.pathname.startsWith('/api/')) {
      if (!GATEWAY_URL) {
        return new Response('Service not configured: GATEWAY_WORKER_URL is missing', { status: 503 });
      }
      const gatewayUrl = new URL(
        url.pathname + url.search,
        GATEWAY_URL
      );

      // Forward the request to gateway
      const headers = new Headers(request.headers);
      headers.set('X-Forwarded-Host', url.host);

      const proxyReq = new Request(gatewayUrl.toString(), {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'manual',
      });

      const res = await fetch(proxyReq);

      // Rewrite redirect locations from gateway domain to pages domain
      const location = res.headers.get('Location');
      if (location && location.includes(new URL(GATEWAY_URL).host)) {
        const newHeaders = new Headers(res.headers);
        newHeaders.set(
          'Location',
          location.replace(GATEWAY_URL, url.origin)
        );
        return new Response(res.body, {
          status: res.status,
          headers: newHeaders,
        });
      }

      return res;
    }

    // Serve static assets
    return env.ASSETS.fetch(request);
  },
};
