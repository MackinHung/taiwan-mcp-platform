/**
 * URL Inspector — extracts URLs from MCP tool call responses
 * and compares against declared external URLs.
 */

const URL_REGEX = /https?:\/\/[^\s"'<>)\]},]+/g;

/**
 * Extract all URLs from a response body string.
 */
export function extractUrls(responseBody: string): string[] {
  const matches = responseBody.match(URL_REGEX);
  if (!matches) return [];
  // Deduplicate
  return [...new Set(matches)];
}

/**
 * Extract origin (protocol + host) from a URL.
 * Returns null if URL is invalid.
 */
export function extractOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Find URLs in a response that are not in the declared list.
 * Comparison is at origin level (protocol + host).
 */
export function findUndeclaredUrls(
  responseUrls: string[],
  declaredUrls: string[]
): string[] {
  const declaredOrigins = new Set(
    declaredUrls
      .map(u => extractOrigin(u))
      .filter((o): o is string => o !== null)
  );

  return responseUrls.filter(url => {
    const origin = extractOrigin(url);
    return origin !== null && !declaredOrigins.has(origin);
  });
}
