export interface RuleResult {
  ruleName: string;
  pass: boolean;
  severity: 'info' | 'warn' | 'fail';
  details: string;
}

function stripComments(code: string): string {
  return code
    .split('\n')
    .map((line) => {
      const commentIdx = line.indexOf('//');
      return commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    })
    .join('\n');
}

const ENV_ACCESS_PATTERNS = [
  /\bprocess\.env\b/,
  /\bDeno\.env\b/,
] as const;

// Exfiltration: sending env vars via network
const EXFIL_PATTERN = /(?:fetch|axios|request|http)\s*\([^)]*process\.env/;

// Hardcoded secret patterns (fail severity)
const SECRET_PATTERNS = [
  { regex: /["'`]sk-[a-zA-Z0-9]{10,}["'`]/, label: 'OpenAI API key (sk-)' },
  { regex: /["'`]ghp_[a-zA-Z0-9]{10,}["'`]/, label: 'GitHub token (ghp_)' },
  { regex: /["'`]gho_[a-zA-Z0-9]{10,}["'`]/, label: 'GitHub OAuth token (gho_)' },
  { regex: /["'`]AKIA[0-9A-Z]{16}["'`]/, label: 'AWS access key' },
  { regex: /["'`]sk_live_[a-zA-Z0-9]{10,}["'`]/, label: 'Stripe secret key' },
  { regex: /["'`]pk_live_[a-zA-Z0-9]{10,}["'`]/, label: 'Stripe publishable key' },
  { regex: /["'`]xox[bpras]-[a-zA-Z0-9-]{10,}["'`]/, label: 'Slack token' },
  { regex: /["'`]SG\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}["'`]/, label: 'SendGrid API key' },
  { regex: /-----BEGIN\s(?:RSA\s)?PRIVATE\sKEY-----/, label: 'Private key' },
  { regex: /["'`]eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}["'`]/, label: 'JWT token' },
] as const;

export function envLeak(sourceCode: string): RuleResult {
  const cleaned = stripComments(sourceCode);

  // Check for exfiltration first (highest severity)
  if (EXFIL_PATTERN.test(cleaned)) {
    return {
      ruleName: 'env-leak',
      pass: false,
      severity: 'fail',
      details: 'Potential env variable exfiltration detected',
    };
  }

  // Check for hardcoded secrets (fail severity)
  const secrets: string[] = [];
  for (const { regex, label } of SECRET_PATTERNS) {
    if (regex.test(cleaned)) {
      secrets.push(label);
    }
  }

  if (secrets.length > 0) {
    return {
      ruleName: 'env-leak',
      pass: false,
      severity: 'fail',
      details: `Hardcoded secrets detected: ${secrets.join(', ')}`,
    };
  }

  // Check for env access (warn severity)
  const ENV_LABELS = ['process.env', 'Deno.env'] as const;
  const found: string[] = [];
  for (let i = 0; i < ENV_ACCESS_PATTERNS.length; i++) {
    if (ENV_ACCESS_PATTERNS[i].test(cleaned)) {
      found.push(ENV_LABELS[i]);
    }
  }

  if (found.length > 0) {
    return {
      ruleName: 'env-leak',
      pass: false,
      severity: 'warn',
      details: `Environment variable access detected: ${found.join(', ')}`,
    };
  }

  return {
    ruleName: 'env-leak',
    pass: true,
    severity: 'info',
    details: 'No environment variable access detected',
  };
}
