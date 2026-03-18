// Pages Function: proxy all /mcp/* requests to composer worker

interface Env {
  COMPOSER_URL: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const composerUrl = context.env.COMPOSER_URL || 'https://mcp-composer.xxx.workers.dev';
  const targetUrl = `${composerUrl}${url.pathname}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.set('X-Forwarded-Host', url.hostname);

  return fetch(targetUrl, {
    method: context.request.method,
    headers,
    body: context.request.body,
    redirect: 'manual',
  });
};
