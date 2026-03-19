export interface OriginValidationResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

const LOCALHOST_PATTERN = /^http:\/\/localhost(:\d+)?$/;

/**
 * Validates the Origin header against a whitelist.
 * - No Origin header (non-browser clients) → allowed
 * - Empty allowedOrigins list → allowed (no restriction configured)
 * - localhost with any port → always allowed
 * - Whitelisted origin → allowed
 * - Otherwise → rejected
 */
export function validateOrigin(
  origin: string | undefined,
  allowedOrigins: readonly string[],
): OriginValidationResult {
  if (origin === undefined) {
    return { allowed: true };
  }

  if (origin === '') {
    return { allowed: false, reason: 'Empty Origin header' };
  }

  if (allowedOrigins.length === 0) {
    return { allowed: true };
  }

  if (LOCALHOST_PATTERN.test(origin)) {
    return { allowed: true };
  }

  if (allowedOrigins.includes(origin)) {
    return { allowed: true };
  }

  return { allowed: false, reason: `Origin not allowed: ${origin}` };
}
