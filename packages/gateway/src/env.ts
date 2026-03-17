export interface Env {
  DB: D1Database;
  RATE_LIMITS: KVNamespace;
  API_KEY_CACHE: KVNamespace;
  SESSION_CACHE: KVNamespace;
  SERVER_CACHE: KVNamespace;
  PACKAGES: R2Bucket;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_REDIRECT_URI: string;
  FRONTEND_URL: string;
  JWT_SECRET: string;
}
