// Pages Advanced Mode: proxy /api/* to gateway, serve static for everything else
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const COMPOSER_URL = env.COMPOSER_WORKER_URL || 'https://mcp-composer.watermelom5404.workers.dev';
    const GATEWAY_URL = env.GATEWAY_WORKER_URL || 'https://mcp-gateway.watermelom5404.workers.dev';

    // Proxy /mcp/* to Composer Worker (Streamable HTTP: POST + GET + DELETE)
    if (url.pathname.startsWith('/mcp/')) {
      const composerUrl = new URL(
        url.pathname + url.search,
        COMPOSER_URL
      );
      const reqHeaders = new Headers(request.headers);
      reqHeaders.set('X-Forwarded-Host', url.host);

      const upstreamRes = await fetch(composerUrl.toString(), {
        method: request.method,
        headers: reqHeaders,
        body: request.body,
      });

      // Build response headers, preserving SSE and session headers
      const resHeaders = new Headers(upstreamRes.headers);
      const SSE_HEADERS = ['Content-Type', 'Cache-Control', 'Connection', 'Mcp-Session-Id'];
      for (const key of SSE_HEADERS) {
        const val = upstreamRes.headers.get(key);
        if (val) resHeaders.set(key, val);
      }

      // Stream body through without buffering
      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        headers: resHeaders,
      });
    }

    if (url.pathname.startsWith('/api/')) {
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
