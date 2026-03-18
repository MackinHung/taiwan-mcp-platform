// Pages Advanced Mode: proxy /api/* to gateway, serve static for everything else
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Proxy /mcp/* to Composer Worker
    if (url.pathname.startsWith('/mcp/')) {
      const composerUrl = new URL(
        url.pathname + url.search,
        'https://mcp-composer.watermelom5404.workers.dev'
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
      const gatewayUrl = new URL(
        url.pathname + url.search,
        'https://mcp-gateway.watermelom5404.workers.dev'
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
      if (location && location.includes('mcp-gateway.watermelom5404.workers.dev')) {
        const newHeaders = new Headers(res.headers);
        newHeaders.set(
          'Location',
          location.replace(
            'https://mcp-gateway.watermelom5404.workers.dev',
            url.origin
          )
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
