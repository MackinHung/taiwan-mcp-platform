// Pages Function: proxy all /api/* requests to gateway worker

interface Env {
  GATEWAY_URL: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const gatewayUrl = context.env.GATEWAY_URL || 'https://mcp-gateway.xxx.workers.dev';
  const targetUrl = `${gatewayUrl}${url.pathname}${url.search}`;

  const headers = new Headers(context.request.headers);
  // Forward the original host for CORS
  headers.set('X-Forwarded-Host', url.hostname);

  return fetch(targetUrl, {
    method: context.request.method,
    headers,
    body: context.request.body,
    redirect: 'manual',
  });
};
