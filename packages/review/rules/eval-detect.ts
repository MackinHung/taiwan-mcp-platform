export interface RuleResult {
  ruleName: string;
  pass: boolean;
  severity: 'info' | 'warn' | 'fail';
  details: string;
}

// Strip single-line comments from code to avoid false positives
function stripComments(code: string): string {
  return code
    .split('\n')
    .map((line) => {
      const commentIdx = line.indexOf('//');
      return commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    })
    .join('\n');
}

const FAIL_PATTERNS = [
  { regex: /\beval\s*\(/, label: 'eval()' },
  { regex: /\bnew\s+Function\s*\(/, label: 'new Function()' },
  { regex: /\.exec\s*\(/, label: 'exec()' },
  { regex: /\bexecSync\s*\(/, label: 'execSync()' },
  { regex: /\bspawn\s*\(/, label: 'spawn()' },
] as const;

// setTimeout/setInterval with string first argument (implicit eval)
const WARN_PATTERNS = [
  { regex: /\bsetTimeout\s*\(\s*["'`]/, label: 'setTimeout(string)' },
  { regex: /\bsetInterval\s*\(\s*["'`]/, label: 'setInterval(string)' },
] as const;

export function evalDetect(sourceCode: string): RuleResult {
  const cleaned = stripComments(sourceCode);
  const failFound: string[] = [];
  const warnFound: string[] = [];

  for (const { regex, label } of FAIL_PATTERNS) {
    if (regex.test(cleaned)) {
      failFound.push(label);
    }
  }

  for (const { regex, label } of WARN_PATTERNS) {
    if (regex.test(cleaned)) {
      warnFound.push(label);
    }
  }

  if (failFound.length > 0) {
    return {
      ruleName: 'eval-detect',
      pass: false,
      severity: 'fail',
      details: `Dangerous code execution detected: ${failFound.join(', ')}`,
    };
  }

  if (warnFound.length > 0) {
    return {
      ruleName: 'eval-detect',
      pass: false,
      severity: 'warn',
      details: `Potentially unsafe code execution: ${warnFound.join(', ')}`,
    };
  }

  return {
    ruleName: 'eval-detect',
    pass: true,
    severity: 'info',
    details: 'No dangerous code execution patterns found',
  };
}
