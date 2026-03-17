export interface NetworkRuleResult {
  ruleName: string;
  pass: boolean;
  severity: 'info' | 'warn' | 'fail';
  details: string;
  detectedUrls: string[];
}

const URL_REGEX = /(?:https?|wss?):\/\/[^\s"'`),;]+/g;

function extractDomain(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

export function networkCheck(
  sourceCode: string,
  declaredExternalUrls: string[]
): NetworkRuleResult {
  const matches = sourceCode.match(URL_REGEX) ?? [];
  const detectedUrls = [...new Set(matches)];

  if (detectedUrls.length === 0) {
    return {
      ruleName: 'network-check',
      pass: true,
      severity: 'info',
      details: 'No external URLs detected',
      detectedUrls: [],
    };
  }

  const declaredOrigins = new Set(
    declaredExternalUrls.map((u) => extractDomain(u))
  );

  const undeclared = detectedUrls.filter(
    (url) => !declaredOrigins.has(extractDomain(url))
  );

  if (undeclared.length > 0) {
    return {
      ruleName: 'network-check',
      pass: false,
      severity: 'fail',
      details: `Undeclared external URLs: ${undeclared.join(', ')}`,
      detectedUrls,
    };
  }

  return {
    ruleName: 'network-check',
    pass: true,
    severity: 'info',
    details: `All ${detectedUrls.length} URL(s) match declared origins`,
    detectedUrls,
  };
}
