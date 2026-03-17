export interface RuleResult {
  ruleName: string;
  pass: boolean;
  severity: 'info' | 'warn' | 'fail';
  details: string;
}

const INJECTION_PATTERNS = [
  { regex: /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts)/i, label: 'ignore instructions' },
  { regex: /you\s+are\s+now\b/i, label: 'persona hijack (you are now)' },
  { regex: /from\s+now\s+on[\s,]+act\s+as/i, label: 'persona hijack (act as)' },
  { regex: /^SYSTEM:\s/m, label: 'system prompt override' },
  { regex: /\bjailbreak\b/i, label: 'jailbreak keyword' },
  { regex: /\bDAN\b/, label: 'DAN jailbreak reference' },
  { regex: /override\s+(all\s+)?safety/i, label: 'safety override' },
] as const;

const MAX_DESCRIPTION_LENGTH = 500;
const ZERO_WIDTH_REGEX = /[\u200B\u200C\u200D\uFEFF\u2060]/;

export function promptInjection(text: string): RuleResult {
  // Check for fail-level injection patterns first
  const found: string[] = [];
  for (const { regex, label } of INJECTION_PATTERNS) {
    if (regex.test(text)) {
      found.push(label);
    }
  }

  if (found.length > 0) {
    return {
      ruleName: 'prompt-injection',
      pass: false,
      severity: 'fail',
      details: `Potential prompt injection detected: ${found.join(', ')}`,
    };
  }

  // Warn-level checks
  const warnings: string[] = [];

  if (text.length > MAX_DESCRIPTION_LENGTH) {
    warnings.push(`excessive length (${text.length} chars)`);
  }

  if (ZERO_WIDTH_REGEX.test(text)) {
    warnings.push('hidden zero-width Unicode characters');
  }

  if (warnings.length > 0) {
    return {
      ruleName: 'prompt-injection',
      pass: false,
      severity: 'warn',
      details: `Suspicious description: ${warnings.join(', ')}`,
    };
  }

  return {
    ruleName: 'prompt-injection',
    pass: true,
    severity: 'info',
    details: 'No prompt injection patterns detected',
  };
}
