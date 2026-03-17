import type { Env, TdxTokenResponse } from './types.js';

const TDX_TOKEN_URL = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token';
const TDX_API_BASE = 'https://tdx.transportdata.tw/api/basic/v2';

// Token cache (Worker-scoped, resets on cold start)
let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const response = await fetch(TDX_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`,
  });

  if (!response.ok) {
    throw new Error(`TDX token error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as TdxTokenResponse;
  cachedToken = data.access_token;
  // Refresh 5 minutes before expiry
  tokenExpiry = now + (data.expires_in - 300) * 1000;
  return cachedToken;
}

export function buildUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${TDX_API_BASE}${endpoint}`);
  url.searchParams.set('$format', 'JSON');
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function fetchEndpoint<T>(
  env: Env,
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const token = await getAccessToken(env.TDX_CLIENT_ID, env.TDX_CLIENT_SECRET);
  const url = buildUrl(endpoint, params);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`TDX API error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

// Reset token cache (for testing)
export function resetTokenCache(): void {
  cachedToken = null;
  tokenExpiry = 0;
}
